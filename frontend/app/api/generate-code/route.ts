import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    // Call the backend API to generate the code
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/projects/${projectId}/generate-code`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.detail || 'Failed to generate code' }, { status: response.status });
    }
    
    // Get the content type and filename from the backend response
    const contentType = response.headers.get('content-type') || 'application/zip';
    const contentDisposition = response.headers.get('content-disposition') || '';
    const filenameMatch = contentDisposition.match(/filename=([^;]+)/);
    const filename = filenameMatch ? filenameMatch[1] : 'app-code.zip';
    
    // Convert the response to a blob
    const blob = await response.arrayBuffer();
    
    // Return the zip file directly
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename=${filename}`
      }
    });
  } catch (error) {
    console.error('Error generating code:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 