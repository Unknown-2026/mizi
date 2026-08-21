import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CameraView, useCameraPermissions, type CameraRatio, type CameraType } from 'expo-camera';
import { Image as ExpoImage } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  Image as RNImage,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type ImageSourcePropType,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiziButton } from '@/components/ui/mizi-button';
import { palette } from '@/constants/theme';
import { destinationImage } from '@/features/adventure/theme';
import type { CaptureMode, CapturedPhoto } from '@/features/adventure/types';

export function CameraScreen({
  capturedPhoto,
  mode,
  onBackToModes,
  onCapture,
  onRetake,
  onSubmit,
  originalPhotoUri,
}: {
  capturedPhoto: CapturedPhoto | null;
  mode: CaptureMode;
  onBackToModes: () => void;
  onCapture: (photo: CapturedPhoto) => void;
  onRetake: () => void;
  onSubmit: () => void;
  originalPhotoUri?: string;
}) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [cameraReady, setCameraReady] = useState(false);
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<PreviewSize | null>(null);
  const [cameraZoom, setCameraZoom] = useState(0);
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialPinchZoomRef = useRef(0);
  const showOverlay = mode === 'overlay';
  const canUseCamera = permission?.granted === true;
  const originalPhotoSource = useMemo<ImageSourcePropType>(
    () => (originalPhotoUri ? { uri: originalPhotoUri } : destinationImage),
    [originalPhotoUri],
  );
  const originalPhotoSize = useImageSize(originalPhotoSource);
  const captureStageInsets = useMemo(
    () => ({
      bottom: insets.bottom + 166,
      horizontal: 0,
      top: insets.top + 88,
    }),
    [insets.bottom, insets.top],
  );
  const captureLayout = useMemo(() => {
    const targetPhotoSize =
      showOverlay && originalPhotoSize ? originalPhotoSize : defaultPortraitPhotoSize;

    if (!previewSize) {
      return null;
    }

    return getCaptureLayout(previewSize, targetPhotoSize, captureStageInsets);
  }, [captureStageInsets, originalPhotoSize, previewSize, showOverlay]);

  const handlePreviewLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    setPreviewSize({ height, width });
  };

  const handleCapture = async () => {
    if (!cameraReady || isTakingPicture) {
      return;
    }

    setIsTakingPicture(true);
    setCameraError(null);

    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.92,
        skipProcessing: false,
      });

      if (photo?.uri) {
        onCapture({
          height: photo.height,
          uri: photo.uri,
          width: photo.width,
        });
      }
    } catch {
      setCameraError('촬영에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsTakingPicture(false);
    }
  };

  const toggleCameraFacing = () => {
    setCameraReady(false);
    setCameraFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const resetPinchZoom = useCallback(() => {
    initialPinchDistanceRef.current = null;
    initialPinchZoomRef.current = cameraZoom;
  }, [cameraZoom]);

  const handlePinchZoom = useCallback(
    (event: GestureResponderEvent) => {
      const touches = event.nativeEvent.touches;

      if (touches.length < 2) {
        resetPinchZoom();
        return;
      }

      const currentDistance = getTouchDistance(touches[0], touches[1]);

      if (!initialPinchDistanceRef.current) {
        initialPinchDistanceRef.current = currentDistance;
        initialPinchZoomRef.current = cameraZoom;
        return;
      }

      const scale = currentDistance / initialPinchDistanceRef.current;
      const nextZoom = clamp(initialPinchZoomRef.current + Math.log(scale) * 0.38, 0, 0.82);
      setCameraZoom(nextZoom);
    },
    [cameraZoom, resetPinchZoom],
  );

  return (
    <View style={styles.cameraScreen}>
      <View style={styles.cameraPreview} onLayout={handlePreviewLayout}>
        {!capturedPhoto && permission && !canUseCamera ? (
          <View style={styles.permissionPanel}>
            <View style={styles.permissionIcon}>
              <MaterialIcons color="#FFFFFF" name="photo-camera" size={28} />
            </View>
            <Text style={styles.permissionTitle}>카메라 권한이 필요해요</Text>
            <Text style={styles.permissionCopy}>
              목적지 인증 사진을 촬영하려면 카메라 접근을 허용해주세요.
            </Text>
            <MiziButton
              label="권한 허용하기"
              onPress={() => {
                void requestPermission();
              }}
            />
          </View>
        ) : null}
        {!capturedPhoto && !permission ? (
          <View style={styles.permissionPanel}>
            <Text style={styles.permissionTitle}>카메라를 준비하고 있어요</Text>
          </View>
        ) : null}
        {canUseCamera || capturedPhoto ? (
          <>
            <View style={styles.topScrim} />
            <View style={styles.bottomScrim} />
          </>
        ) : null}
        {canUseCamera || capturedPhoto ? (
          <CaptureFrame
            cameraFacing={cameraFacing}
            cameraRef={cameraRef}
            captureLayout={captureLayout}
            capturedPhoto={capturedPhoto}
            originalPhotoSource={originalPhotoSource}
            onPinchEnd={resetPinchZoom}
            onPinchZoom={handlePinchZoom}
            stageInsets={captureStageInsets}
            showOverlay={showOverlay && !capturedPhoto}
            zoom={cameraZoom}
            onCameraReady={() => setCameraReady(true)}
            onMountError={() =>
              setCameraError('카메라를 불러오지 못했어요. 권한과 기기를 확인해주세요.')
            }
          />
        ) : null}
        {cameraError ? (
          <View style={styles.cameraErrorBadge}>
            <MaterialIcons color="#FFFFFF" name="error-outline" size={16} />
            <Text style={styles.cameraErrorText}>{cameraError}</Text>
          </View>
        ) : null}
      </View>
      {capturedPhoto ? (
        <View style={[styles.cameraNoticeWrap, { paddingTop: insets.top + 12 }]}>
          <View style={styles.cameraNotice}>
            <View style={styles.noticeIcon}>
              <MaterialIcons color="#FFFFFF" name="lock-outline" size={16} />
            </View>
            <View style={styles.noticeTextWrap}>
              <Text style={styles.noticeTitle}>제출은 한번만 가능해요.</Text>
              <Text style={styles.noticeSubtitle}>제출후에는 변경할 수 없어요.</Text>
            </View>
          </View>
        </View>
      ) : null}
      {capturedPhoto ? (
        <View style={[styles.previewActions, { paddingBottom: insets.bottom + 24 }]}>
          <MiziButton
            label="다시찍기"
            leftIcon="refresh"
            onPress={onRetake}
            style={styles.previewActionButton}
            variant="dark"
          />
          <MiziButton
            label="제출"
            onPress={onSubmit}
            rightIcon="arrow-forward"
            style={styles.previewActionButton}
          />
        </View>
      ) : (
        <>
          <View style={[styles.cameraControls, { paddingBottom: insets.bottom + 26 }]}>
            <Pressable
              style={({ pressed }) => [styles.roundControl, pressed && styles.pressed]}
              onPress={onBackToModes}
            >
              <MaterialIcons color="#FFFFFF" name="close" size={30} />
            </Pressable>
            <Pressable
              accessibilityLabel="촬영"
              disabled={!canUseCamera || !cameraReady || isTakingPicture}
              style={({ pressed }) => [
                styles.shutterButton,
                (!canUseCamera || !cameraReady || isTakingPicture) && styles.disabledControl,
                pressed && styles.pressed,
              ]}
              onPress={handleCapture}
            >
              <View style={styles.shutterInner} />
            </Pressable>
            <Pressable
              disabled={!canUseCamera}
              style={({ pressed }) => [
                styles.roundControl,
                !canUseCamera && styles.disabledControl,
                pressed && styles.pressed,
              ]}
              onPress={toggleCameraFacing}
            >
              <MaterialIcons color="#FFFFFF" name="cameraswitch" size={27} />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

type PreviewSize = {
  height: number;
  width: number;
};

type PhotoSize = {
  height: number;
  width: number;
};

type CaptureLayout = {
  cameraRatio: CameraRatio;
  cameraViewHeight: number;
  cameraViewWidth: number;
  frameHeight: number;
  frameWidth: number;
  outputAspect: number;
  referenceRotation: string;
  referenceSourceHeight: number;
  referenceSourceWidth: number;
};

type CaptureStageInsets = {
  bottom: number;
  horizontal: number;
  top: number;
};

const defaultPortraitPhotoSize = {
  height: 4,
  width: 3,
};

function CaptureFrame({
  cameraFacing,
  cameraRef,
  captureLayout,
  capturedPhoto,
  onPinchEnd,
  onPinchZoom,
  onCameraReady,
  onMountError,
  originalPhotoSource,
  stageInsets,
  showOverlay,
  zoom,
}: {
  cameraFacing: CameraType;
  cameraRef: RefObject<CameraView | null>;
  captureLayout: CaptureLayout | null;
  capturedPhoto: CapturedPhoto | null;
  onPinchEnd: () => void;
  onPinchZoom: (event: GestureResponderEvent) => void;
  onCameraReady: () => void;
  onMountError: () => void;
  originalPhotoSource: ImageSourcePropType;
  stageInsets: CaptureStageInsets;
  showOverlay: boolean;
  zoom: number;
}) {
  if (!captureLayout) {
    return (
      <View
        style={[
          styles.captureFrameLoading,
          {
            bottom: stageInsets.bottom,
            left: stageInsets.horizontal,
            right: stageInsets.horizontal,
            top: stageInsets.top,
          },
        ]}
      >
        <View style={styles.overlayLoadingBadge}>
          <MaterialIcons color="#FFFFFF" name="image-search" size={16} />
          <Text style={styles.overlayLoadingText}>촬영 프레임을 준비하는 중</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.captureFrameLayer,
        {
          bottom: stageInsets.bottom,
          left: stageInsets.horizontal,
          right: stageInsets.horizontal,
          top: stageInsets.top,
        },
      ]}
    >
      <View
        style={[
          styles.captureFrame,
          {
            height: captureLayout.frameHeight,
            width: captureLayout.frameWidth,
          },
        ]}
        onMoveShouldSetResponder={(event) => event.nativeEvent.touches.length >= 2}
        onResponderGrant={onPinchZoom}
        onResponderMove={onPinchZoom}
        onResponderRelease={onPinchEnd}
        onResponderTerminate={onPinchEnd}
      >
        {capturedPhoto ? null : (
          <CameraView
            ref={cameraRef}
            active
            animateShutter
            facing={cameraFacing}
            mode="picture"
            ratio={captureLayout.cameraRatio}
            zoom={zoom}
            onCameraReady={onCameraReady}
            onMountError={onMountError}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View pointerEvents="none" style={styles.cameraVisibleCenterLayer}>
          <View
            style={[
              styles.cameraVisibleArea,
              {
                height: captureLayout.cameraViewHeight,
                width: captureLayout.cameraViewWidth,
              },
            ]}
          >
            {capturedPhoto ? (
              <CapturedPhotoPreview captureLayout={captureLayout} photo={capturedPhoto} />
            ) : null}
            {!capturedPhoto ? <View style={styles.liveCameraTint} /> : null}
            {showOverlay ? (
              <OriginalPhotoOverlay captureLayout={captureLayout} source={originalPhotoSource} />
            ) : null}
            <View style={[styles.overlayCorner, styles.overlayCornerTopLeft]} />
            <View style={[styles.overlayCorner, styles.overlayCornerTopRight]} />
            <View style={[styles.overlayCorner, styles.overlayCornerBottomLeft]} />
            <View style={[styles.overlayCorner, styles.overlayCornerBottomRight]} />
          </View>
        </View>
      </View>
    </View>
  );
}

function OriginalPhotoOverlay({
  captureLayout,
  source,
}: {
  captureLayout: CaptureLayout;
  source: ImageSourcePropType;
}) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.overlayReferenceClip}>
        <ExpoImage
          contentFit="cover"
          source={source}
          style={[
            styles.overlayReferenceImage,
            {
              height: captureLayout.referenceSourceHeight,
              transform: [{ rotate: captureLayout.referenceRotation }],
              width: captureLayout.referenceSourceWidth,
            },
          ]}
        />
        <View style={styles.overlayReferenceTint} />
      </View>
    </View>
  );
}

function CapturedPhotoPreview({
  captureLayout,
  photo,
}: {
  captureLayout: CaptureLayout;
  photo: CapturedPhoto;
}) {
  const frameWidth = captureLayout.cameraViewWidth;
  const frameHeight = captureLayout.cameraViewHeight;
  const photoAspect = photo.width / photo.height;
  const frameIsLandscape = frameWidth > frameHeight;
  const photoIsLandscape = photo.width > photo.height;
  const shouldRotate = frameIsLandscape !== photoIsLandscape;
  const displayedPhotoAspect = shouldRotate ? 1 / photoAspect : photoAspect;
  const displayedSize = getCoverSize(frameWidth, frameHeight, displayedPhotoAspect);

  return (
    <View pointerEvents="none" style={styles.capturedPhotoClip}>
      <ExpoImage
        contentFit="cover"
        source={{ uri: photo.uri }}
        style={[
          styles.capturedPhotoImage,
          {
            height: shouldRotate ? displayedSize.width : displayedSize.height,
            transform: shouldRotate ? [{ rotate: '90deg' }] : undefined,
            width: shouldRotate ? displayedSize.height : displayedSize.width,
          },
        ]}
      />
    </View>
  );
}

function useImageSize(source: ImageSourcePropType) {
  const [size, setSize] = useState<PhotoSize | null>(null);

  useEffect(() => {
    let mounted = true;
    const resolvedSource = RNImage.resolveAssetSource(source);

    if (resolvedSource?.width && resolvedSource.height) {
      setSize({ height: resolvedSource.height, width: resolvedSource.width });
      return () => {
        mounted = false;
      };
    }

    if (resolvedSource?.uri) {
      RNImage.getSize(
        resolvedSource.uri,
        (width, height) => {
          if (mounted) {
            setSize({ height, width });
          }
        },
        () => {
          if (mounted) {
            setSize(null);
          }
        },
      );
    }

    return () => {
      mounted = false;
    };
  }, [source]);

  return size;
}

type TouchPoint = {
  pageX: number;
  pageY: number;
};

function getTouchDistance(firstTouch: TouchPoint, secondTouch: TouchPoint) {
  const deltaX = secondTouch.pageX - firstTouch.pageX;
  const deltaY = secondTouch.pageY - firstTouch.pageY;

  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getCaptureLayout(
  previewSize: PreviewSize,
  photoSize: PhotoSize,
  stageInsets: CaptureStageInsets,
): CaptureLayout {
  const photoAspect = photoSize.width / photoSize.height;
  const shouldRotateReference = photoAspect > 1;
  const displayedPhotoAspect = shouldRotateReference ? 1 / photoAspect : photoAspect;
  const maxWidth = Math.max(previewSize.width - stageInsets.horizontal * 2, 1);
  const maxHeight = Math.max(previewSize.height - stageInsets.top - stageInsets.bottom, 1);
  const requestedOutputAspect =
    displayedPhotoAspect >= 1 ? displayedPhotoAspect : 1 / displayedPhotoAspect;
  const cameraRatio = getCameraRatio(requestedOutputAspect);
  const outputAspect = getCameraRatioValue(cameraRatio);
  const cameraDisplayAspect = displayedPhotoAspect >= 1 ? outputAspect : 1 / outputAspect;
  const frameSize = getContainSize(maxWidth, maxHeight, cameraDisplayAspect);
  const referenceVisualSize = getCoverSize(frameSize.width, frameSize.height, displayedPhotoAspect);

  return {
    cameraRatio,
    cameraViewHeight: frameSize.height,
    cameraViewWidth: frameSize.width,
    frameHeight: frameSize.height,
    frameWidth: frameSize.width,
    outputAspect,
    referenceRotation: shouldRotateReference ? '90deg' : '0deg',
    referenceSourceHeight: shouldRotateReference
      ? referenceVisualSize.width
      : referenceVisualSize.height,
    referenceSourceWidth: shouldRotateReference
      ? referenceVisualSize.height
      : referenceVisualSize.width,
  };
}

function getContainSize(frameWidth: number, frameHeight: number, aspectRatio: number) {
  const frameAspect = frameWidth / frameHeight;

  if (aspectRatio > frameAspect) {
    return {
      height: frameWidth / aspectRatio,
      width: frameWidth,
    };
  }

  return {
    height: frameHeight,
    width: frameHeight * aspectRatio,
  };
}

function getCoverSize(frameWidth: number, frameHeight: number, aspectRatio: number) {
  const frameAspect = frameWidth / frameHeight;

  if (aspectRatio > frameAspect) {
    return {
      height: frameHeight,
      width: frameHeight * aspectRatio,
    };
  }

  return {
    height: frameWidth / aspectRatio,
    width: frameWidth,
  };
}

function getCameraRatio(outputAspect: number): CameraRatio {
  const ratioCandidates: { ratio: CameraRatio; value: number }[] = [
    { ratio: '4:3', value: 4 / 3 },
    { ratio: '16:9', value: 16 / 9 },
    { ratio: '1:1', value: 1 },
  ];

  return ratioCandidates.reduce((best, current) =>
    Math.abs(current.value - outputAspect) < Math.abs(best.value - outputAspect) ? current : best,
  ).ratio;
}

function getCameraRatioValue(cameraRatio: CameraRatio) {
  const [width, height] = cameraRatio.split(':').map(Number);

  if (!width || !height) {
    return 4 / 3;
  }

  return width / height;
}

const styles = StyleSheet.create({
  cameraControls: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 48,
    position: 'absolute',
    width: '100%',
  },
  cameraNoticeWrap: {
    left: 0,
    paddingHorizontal: 16,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 20,
  },
  cameraNotice: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(47, 155, 111, 0.22)',
    borderRadius: 8,
    borderWidth: 1,
    elevation: 20,
    flexDirection: 'row',
    gap: 9,
    maxWidth: 380,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#0B4C43',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    width: '100%',
  },
  cameraPreview: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  capturedPhotoClip: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  capturedPhotoImage: {
    position: 'absolute',
  },
  cameraScreen: {
    backgroundColor: '#000000',
    flex: 1,
  },
  cameraVisibleArea: {
    overflow: 'hidden',
    position: 'relative',
  },
  cameraVisibleCenterLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureFrame: {
    backgroundColor: '#000000',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  captureFrameLayer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 2,
  },
  captureFrameLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 2,
  },
  cameraErrorBadge: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(209, 76, 76, 0.92)',
    borderRadius: 18,
    bottom: 140,
    flexDirection: 'row',
    gap: 6,
    maxWidth: '88%',
    paddingHorizontal: 13,
    paddingVertical: 8,
    position: 'absolute',
  },
  cameraErrorText: {
    color: '#FFFFFF',
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
  liveCameraTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  bottomScrim: {
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    bottom: 0,
    height: 210,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  topScrim: {
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    height: 138,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  disabledControl: {
    opacity: 0.36,
  },
  overlayCorner: {
    borderColor: '#FFFFFF',
    height: 26,
    position: 'absolute',
    width: 26,
  },
  overlayCornerBottomLeft: {
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    bottom: 10,
    left: 10,
  },
  overlayCornerBottomRight: {
    borderBottomWidth: 3,
    borderRightWidth: 3,
    bottom: 10,
    right: 10,
  },
  overlayCornerTopLeft: {
    borderLeftWidth: 3,
    borderTopWidth: 3,
    left: 10,
    top: 10,
  },
  overlayCornerTopRight: {
    borderRightWidth: 3,
    borderTopWidth: 3,
    right: 10,
    top: 10,
  },
  overlayLoadingBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(18, 22, 21, 0.58)',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  overlayLoadingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
  },
  overlayReferenceImage: {
    opacity: 0.62,
    position: 'absolute',
  },
  overlayReferenceClip: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  overlayReferenceTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  permissionCopy: {
    color: 'rgba(255, 255, 255, 0.68)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 21,
    marginBottom: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  permissionIcon: {
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginBottom: 14,
    width: 48,
  },
  permissionPanel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: '#000000',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  previewActions: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    left: 18,
    position: 'absolute',
    right: 18,
  },
  previewActionButton: {
    flex: 1,
  },
  roundControl: {
    alignItems: 'center',
    backgroundColor: 'rgba(28, 28, 30, 0.78)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 26,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  shutterButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255, 255, 255, 0.36)',
    borderRadius: 38,
    borderWidth: 3,
    height: 74,
    justifyContent: 'center',
    width: 74,
  },
  shutterInner: {
    borderColor: '#2B302E',
    borderRadius: 28,
    borderWidth: 1.5,
    height: 56,
    width: 56,
  },
  noticeIcon: {
    alignItems: 'center',
    backgroundColor: palette.green,
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  noticeSubtitle: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    marginTop: 2,
  },
  noticeTextWrap: {
    flexShrink: 1,
  },
  noticeTitle: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
  },
});
