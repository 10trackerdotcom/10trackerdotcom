import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminAuth } from '@/middleware/adminAuth';

// Force Node.js runtime for file operations (required for Vercel)
export const runtime = 'nodejs';
// Increase max duration for large file uploads (Vercel Pro: 60s, Hobby: 10s)
export const maxDuration = 30;

// Create Supabase client with service role key (bypasses RLS)
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. This is required for file uploads.');
  }
  
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function POST(request) {
  try {
    // Verify admin access
    const { isAdmin, error: authError } = await verifyAdminAuth(request);
    
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: authError || 'Admin access required' },
        { status: 403 }
      );
    }

    // Get Supabase client with service role key
    const supabase = getSupabaseClient();

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `articles/${timestamp}-${randomString}.${fileExt}`;

    // Convert file to format compatible with Supabase Storage
    // Supabase accepts: Blob, ArrayBuffer, File, Buffer, or Uint8Array
    let fileData;
    try {
      // Try multiple approaches for maximum compatibility
      if (file instanceof File || file instanceof Blob) {
        // For File/Blob objects, convert to ArrayBuffer then Buffer
        const arrayBuffer = await file.arrayBuffer();
        fileData = Buffer.from(arrayBuffer);
      } else if (Buffer.isBuffer(file)) {
        // Already a Buffer
        fileData = file;
      } else if (file.arrayBuffer) {
        // Has arrayBuffer method
        const arrayBuffer = await file.arrayBuffer();
        fileData = Buffer.from(arrayBuffer);
      } else {
        // Last resort: try to read as stream
        const chunks = [];
        if (file.stream) {
          const reader = file.stream().getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(Buffer.from(value));
          }
          fileData = Buffer.concat(chunks);
        } else {
          throw new Error('Unsupported file format');
        }
      }
    } catch (bufferError) {
      console.error('Buffer conversion error:', bufferError);
      return NextResponse.json(
        { success: false, error: 'Failed to process file. Please try again.' },
        { status: 500 }
      );
    }

    // Upload to Supabase Storage using service role (bypasses RLS)
    // Supabase Storage accepts Buffer directly in Node.js environments (Vercel uses Node.js runtime)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('article-images')
      .upload(fileName, fileData, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      
      // Provide helpful error messages
      if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Storage bucket "article-images" not found. Please create it in Supabase Storage settings.' 
          },
          { status: 500 }
        );
      }
      
      if (uploadError.message?.includes('policy') || uploadError.message?.includes('security')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Storage permission error. Please check RLS policies or use service role key.' 
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to upload image: ' + uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('article-images')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: fileName
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing. Please add it to your environment variables.' 
        },
        { status: 500 }
      );
    }
    
    if (error.message?.includes('timeout') || error.message?.includes('duration')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Upload timeout. The file may be too large or the server is taking too long. Try a smaller image.' 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to upload image. Please try again.' 
      },
      { status: 500 }
    );
  }
}
