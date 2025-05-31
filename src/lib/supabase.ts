import type { Bucket } from '@/server/bucket';
import { createClient } from '@supabase/supabase-js';

export const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type supabaseUploadToSignedUrl = { file: File; path: string; token: string; bucket: Bucket };
export const uploadFileToSignedUrl = async ({ file, path, token, bucket }: supabaseUploadToSignedUrl) => {
    try {
        const { data: uploadResponse, error } = await supabaseClient.storage.from(bucket).uploadToSignedUrl(path, token, file);

        if (error) throw error;
        if (!uploadResponse) throw new Error('No Image');

        const { publicUrl } = supabaseClient.storage.from(bucket).getPublicUrl(uploadResponse.path).data;

        return publicUrl;
    } catch (error) {
        throw error;
    }
};
