declare module '@browserstack/ai-sdk-node' {
    import type { Capabilities } from '@wdio/types'

    namespace BrowserstackHealing {
      type InitSuccessResponse = {
        isAuthenticated: true;
        userId: number;
        groupId: number;
        sessionToken: string;
        isGroupAIEnabled: boolean;
        isHealingEnabled: boolean;
        defaultLogDataEnabled: boolean;
      };

      type InitErrorResponse = {
        isAuthenticated: false;
        message?: string;
        status?: number;
      };

      export function init(
        accessToken: string,
        userName: string,
        url: string,
        sdkVersion: string
      ): Promise<InitSuccessResponse | InitErrorResponse>;

      export function setToken(
        sessionId: string,
        accessToken: string,
        url: string
      ): Promise<void>;

      export function logData(
        locatorType: string,
        locatorValue: string,
        projectName?: string,
        testName?: string,
        groupId: number,
        sessionId: string,
        listOfCommands?: string[],
        tcgEndpoint?: string,
        sessionToken?: string,
        referenceId?: string | null,
        rootId?: string | null,
        isGetShadowRoot?: boolean
      ): Promise<string>;

      export function healFailure(
        locatorType: string,
        locatorValue: string,
        projectName?: string,
        testName?: string,
        userId: number,
        groupId: number,
        sessionId: string,
        listOfCommands?: string[],
        logs?: any,
        groupAIEnabled: boolean,
        tcgEndpoint?: string,
        sessionToken?: string
      ): Promise<string>;

      export function pollResult(
        url: string,
        sessionId: string,
        accessToken: string
      ): Promise<{ selector: string; value: string } | null>;

      export function initializeCapabilities(
        capabilities: Capabilities.RemoteCapability
      ): Capabilities.RemoteCapability;

      export function getFirefoxAddonPath(): string;
    }
  }
