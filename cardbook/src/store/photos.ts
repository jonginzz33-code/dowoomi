import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

// 사진은 서버가 아니라 이 폰의 앱 전용 폴더(문서 폴더)에 저장합니다.
// 앱을 지우기 전까지 시스템이 임의로 지우지 않는 위치입니다.
const photoDir = () => new Directory(Paths.document, 'card-photos');

/** 카드 비율 63 × 88 mm */
export const CARD_ASPECT: [number, number] = [63, 88];
/** 저장할 사진 폭(px). 1장에 약 100~200KB가 되도록 줄입니다. */
const SAVE_WIDTH = 720;

export type PhotoSource = 'camera' | 'library';

/** 카메라나 앨범에서 사진을 받아 카드 비율로 자르고, 줄여서, 앱 폴더에 저장합니다. 저장된 파일 이름을 돌려줍니다. */
export async function pickAndSavePhoto(source: PhotoSource, baseName: string): Promise<string | null> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: CARD_ASPECT,
    quality: 1,
  };

  let result: ImagePicker.ImagePickerResult;
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error('카메라 권한이 필요해요. 설정에서 카메라 권한을 허용해 주세요.');
    result = await ImagePicker.launchCameraAsync(options);
  } else {
    result = await ImagePicker.launchImageLibraryAsync(options);
  }
  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  const ctx = ImageManipulator.manipulate(asset.uri);
  if (asset.width > SAVE_WIDTH) ctx.resize({ width: SAVE_WIDTH });
  const image = await ctx.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });

  const dir = photoDir();
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const fileName = `${baseName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.jpg`;
  new File(saved.uri).moveSync(new File(dir, fileName));
  return fileName;
}

export const photoUri = (fileName: string) => new File(photoDir(), fileName).uri;

export function deletePhoto(fileName: string) {
  try {
    const f = new File(photoDir(), fileName);
    if (f.exists) f.delete();
  } catch {
    // 이미 없으면 무시
  }
}
