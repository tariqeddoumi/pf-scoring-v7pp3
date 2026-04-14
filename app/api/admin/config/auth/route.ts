import { NextResponse } from 'next/server';

/**
 * Simple authentication configuration endpoint.
 *
 * This route gives the front end a stable endpoint while the full
 * persistence layer is being finalized. For now, settings are served
 * from defaults and PATCH echoes the validated payload back.
 *
 * In the next iteration this route can be backed by a dedicated table
 * or a parameter store without changing the front-end contract.
 */
const DEFAULT_AUTH_SETTINGS = {
  passwordMinLength: 8,
  sessionTimeoutMinutes: 120,
  enablePassword: true,
  enableOAuth: false,
  enableSAML: false,
};

export async function GET() {
  return NextResponse.json({ success: true, data: DEFAULT_AUTH_SETTINGS });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const settings = {
      ...DEFAULT_AUTH_SETTINGS,
      ...body,
    };

    if (settings.passwordMinLength < 6 || settings.passwordMinLength > 64) {
      return NextResponse.json(
        { success: false, error: 'passwordMinLength must be between 6 and 64' },
        { status: 400 }
      );
    }

    if (
      settings.sessionTimeoutMinutes < 5 ||
      settings.sessionTimeoutMinutes > 10080
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'sessionTimeoutMinutes must be between 5 and 10080',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: settings,
      message:
        'Authentication settings accepted. Persistent storage will be wired in the next implementation phase.',
    });
  } catch (error) {
    console.error('[AUTH CONFIG PATCH]', error);
    return NextResponse.json(
      { success: false, error: 'Invalid authentication settings payload' },
      { status: 400 }
    );
  }
}
