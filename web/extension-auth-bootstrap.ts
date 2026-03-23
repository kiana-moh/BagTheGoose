export interface SilentExtensionBootstrapOptions {
  extensionId: string;
  prepareEndpoint?: string;
}

interface ChromeRuntimeWithMessaging {
  runtime?: {
    sendMessage: (
      extensionId: string,
      message: Record<string, unknown>,
      callback?: (response: unknown) => void
    ) => void;
    lastError?: {
      message?: string;
    };
  };
}

declare global {
  interface Window {
    chrome?: ChromeRuntimeWithMessaging;
  }
}

async function sendExtensionMessage<T>(
  extensionId: string,
  message: Record<string, unknown>
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (!window.chrome?.runtime?.sendMessage) {
      reject(new Error("Chrome runtime messaging is unavailable."));
      return;
    }

    window.chrome.runtime.sendMessage(extensionId, message, (response) => {
      const lastError = window.chrome?.runtime?.lastError;
      if (lastError) {
        reject(new Error(lastError.message || "Extension message failed."));
        return;
      }

      resolve(response as T);
    });
  });
}

export async function silentlyBootstrapExtension(
  options: SilentExtensionBootstrapOptions
): Promise<{ connected: boolean; reason?: string }> {
  try {
    const ping = await sendExtensionMessage<{ ok?: boolean }>(options.extensionId, {
      type: "BAG_THE_GOOSE_PING"
    });
    if (!ping?.ok) {
      return {
        connected: false,
        reason: "Extension ping did not succeed."
      };
    }
  } catch {
    return {
      connected: false,
      reason: "Extension not installed or not reachable."
    };
  }

  const prepareResponse = await fetch(
    options.prepareEndpoint ?? "/api/v1/extension/bootstrap/prepare",
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        extensionId: options.extensionId
      })
    }
  );

  if (!prepareResponse.ok) {
    return {
      connected: false,
      reason: "Authenticated bootstrap preparation failed."
    };
  }

  const bootstrap = (await prepareResponse.json()) as {
    bootstrapToken: string;
    expiresAt: string;
  };

  try {
    const response = await sendExtensionMessage<{ ok?: boolean; error?: string }>(options.extensionId, {
      type: "BAG_THE_GOOSE_BOOTSTRAP_AUTH",
      bootstrapToken: bootstrap.bootstrapToken
    });

    if (!response?.ok) {
      return {
        connected: false,
        reason: response?.error || "Extension bootstrap was rejected."
      };
    }

    return { connected: true };
  } catch (error) {
    return {
      connected: false,
      reason: error instanceof Error ? error.message : "Extension bootstrap failed."
    };
  }
}
