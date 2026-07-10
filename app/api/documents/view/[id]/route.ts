import { NextRequest, NextResponse } from 'next/server'
import { API_URL } from '@/src/lib/api-config'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = req.headers.get('Authorization')
  if (!auth) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  // Étape 1 : obtenir l'URL signée depuis le backend (serveur → backend, pas de CORS)
  const urlRes = await fetch(`${API_URL}/documents/users/download-url/${id}`, {
    headers: { Authorization: auth },
  })
  if (!urlRes.ok) return NextResponse.json({ error: 'DOWNLOAD_URL_FAILED' }, { status: urlRes.status })

  const { data } = await urlRes.json()
  if (!data?.url) return NextResponse.json({ error: 'NO_URL' }, { status: 500 })

  // Étape 2 : construire l'URL de téléchargement complète
  const downloadUrl = data.url.startsWith('http')
    ? data.url
    : `${new URL(API_URL).origin}${data.url}`

  // Étape 3 : appeler la route de téléchargement (peut retourner JSON avec URL S3 ou le fichier direct)
  const dlRes = await fetch(downloadUrl)
  if (!dlRes.ok) return NextResponse.json({ error: 'DOWNLOAD_FAILED' }, { status: dlRes.status })

  if (dlRes.headers.get('Content-Type')?.includes('application/json')) {
    // Le backend renvoie une URL S3 signée → on la fetche côté serveur (pas de CORS)
    const json = await dlRes.json()
    const s3Url: string | undefined = json.data?.url
    if (!s3Url) return NextResponse.json({ error: 'NO_S3_URL' }, { status: 500 })

    const s3Res = await fetch(s3Url)
    if (!s3Res.ok) return NextResponse.json({ error: 'S3_FAILED' }, { status: s3Res.status })

    return new NextResponse(s3Res.body, {
      headers: {
        'Content-Type': s3Res.headers.get('Content-Type') ?? 'application/octet-stream',
        'Cache-Control': 'private, max-age=300',
      },
    })
  }

  // Fichier servi directement par le backend
  return new NextResponse(dlRes.body, {
    headers: {
      'Content-Type': dlRes.headers.get('Content-Type') ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=300',
    },
  })
}
