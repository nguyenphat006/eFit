import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Check if NEXT_LOCALE cookie exists
  const localeCookie = request.cookies.get('NEXT_LOCALE');
  
  if (!localeCookie) {
    // Force Vietnamese as the default language
    response.cookies.set('NEXT_LOCALE', 'vi', {
      path: '/',
      maxAge: 31536000, // 1 year in seconds
    });
  }
  
  return response;
}

export const config = {
  // Run middleware only for webpage routes, ignoring assets, APIs, and static folders
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
