import { NextRequest, NextResponse } from "next/server";
import { withPermissionAuth } from "@/lib/auth-middleware";
import { auditSensitiveAction } from "@/lib/services/audit-trail-service";

const DEFAULT_AUTH_SETTINGS = {
  passwordMinLength: 12,
  sessionTimeoutMinutes: 120,
  enablePassword: true,
  enableOAuth: false,
  enableSAML: false,
};

interface AuthSettingsPayload {
  passwordMinLength?: number;
  sessionTimeoutMinutes?: number;
  enablePassword?: boolean;
  enableOAuth?: boolean;
  enableSAML?: boolean;
}

export async function GET(request: NextRequest) {
  return withPermissionAuth(request, "SYSTEM_CONFIG_UPDATE", async (_req, user) => {
    await auditSensitiveAction({
      userId: user.userId,
      action: "ADMIN_CONFIG_AUTH_READ",
      details: DEFAULT_AUTH_SETTINGS,
    });
    return NextResponse.json({ success: true, data: DEFAULT_AUTH_SETTINGS });
  });
}

export async function PATCH(request: NextRequest) {
  return withPermissionAuth(request, "SYSTEM_CONFIG_UPDATE", async (req, user) => {
    try {
      const body = (await req.json()) as AuthSettingsPayload;
      const settings = {
        ...DEFAULT_AUTH_SETTINGS,
        ...body,
      };

      if (settings.passwordMinLength < 12 || settings.passwordMinLength > 64) {
        return NextResponse.json(
          { success: false, error: "passwordMinLength must be between 12 and 64" },
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
            error: "sessionTimeoutMinutes must be between 5 and 10080",
          },
          { status: 400 }
        );
      }

      await auditSensitiveAction({
        userId: user.userId,
        action: "ADMIN_CONFIG_AUTH_UPDATE",
        details: settings,
      });

      return NextResponse.json({
        success: true,
        data: settings,
        message: "Authentication settings accepted.",
      });
    } catch (error) {
      console.error("[AUTH CONFIG PATCH]", error);
      return NextResponse.json(
        { success: false, error: "Invalid authentication settings payload" },
        { status: 400 }
      );
    }
  });
}
