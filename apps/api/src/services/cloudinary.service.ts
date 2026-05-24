import { cloudinary } from '../config/cloudinary'
import { Readable } from 'stream'
import logger from '../utils/logger'

export interface UploadResult {
  publicId: string
  url: string
  secureUrl: string
  width: number
  height: number
  format: string
  bytes: number
}

export async function uploadImage(
  buffer: Buffer,
  options: {
    folder?: string
    publicId?: string
    transformation?: object[]
  } = {}
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder ?? 'makazihub/listings',
        public_id: options.publicId,
        resource_type: 'image',
        format: 'webp',
        transformation: options.transformation ?? [
          { width: 1280, height: 960, crop: 'limit', quality: 'auto:good' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          logger.error({ error }, 'Cloudinary upload failed')
          return reject(error ?? new Error('Upload failed'))
        }

        resolve({
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        })
      }
    )

    const readable = new Readable()
    readable.push(buffer)
    readable.push(null)
    readable.pipe(uploadStream)
  })
}

export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
    logger.info({ publicId }, 'Cloudinary image deleted')
  } catch (err) {
    logger.error({ err, publicId }, 'Failed to delete Cloudinary image')
    throw err
  }
}

export function getThumbnailUrl(secureUrl: string, width = 400, height = 300): string {
  // Transform the URL to generate a thumbnail
  return secureUrl.replace(
    '/upload/',
    `/upload/w_${width},h_${height},c_fill,q_auto,f_webp/`
  )
}

export const cloudinaryService = {
  uploadImage,
  deleteImage,
  getThumbnailUrl,
}
