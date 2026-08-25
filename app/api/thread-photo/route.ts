import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const MAX_BYTES = 8 * 1024 * 1024

export async function POST(request: Request) {
  const form = await request.formData()
  const side = form.get('side')
  const token = form.get('token')
  const threadId = form.get('thread_id')
  const file = form.get('file')

  if (side !== 'contractor' && side !== 'homeowner') {
    return NextResponse.json({ error: 'invalid-side' }, { status: 400 })
  }
  if (typeof token !== 'string' || !token) {
    return NextResponse.json({ error: 'missing-token' }, { status: 400 })
  }
  if (side === 'homeowner' && (typeof threadId !== 'string' || !threadId)) {
    return NextResponse.json({ error: 'missing-thread-id' }, { status: 400 })
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'missing-file' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'invalid-file-type' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'file-too-large' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'missing-service-key' }, { status: 500 })
  }

  const service = createClient(supabaseUrl!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const path = `web/${side}/${Date.now()}-${Math.random().toString(16).slice(2)}.jpg`
  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error: uploadError } = await service.storage
    .from('job-photos')
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true })
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/job-photos/${path}`

  const { data, error } = await service.rpc('add_thread_photo', {
    p_side: side,
    p_token: token,
    p_thread_id: (typeof threadId === 'string' && threadId) || null,
    p_url: publicUrl,
  })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ...(data ?? {}), url: publicUrl })
}
