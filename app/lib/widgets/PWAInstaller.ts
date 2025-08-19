/**
 * The BeforeInstallPromptEvent is fired at the Window.onbeforeinstallprompt handler
 * before a user is prompted to "install" a web site to a home screen on mobile.
 *
 * @deprecated Only supported on Chrome and Android Webview.
 */
interface BeforeInstallPromptEvent extends Event {

  /**
   * Returns an array of DOMString items containing the platforms on which the event was dispatched.
   * This is provided for user agents that want to present a choice of versions to the user such as,
   * for example, "web" or "play" which would allow the user to chose between a web version or
   * an Android version.
   */
  readonly platforms: Array<string>;

  /**
   * Returns a Promise that resolves to a DOMString containing either "accepted" or "dismissed".
   */
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;

  /**
   * Allows a developer to show the install prompt at a time of their own choosing.
   * This method returns a Promise.
   */
  prompt(): Promise<void>;

}

export function isChrome() {
  const ua = navigator.userAgent;
  return /Chrome/.test(ua) && !/Edg|OPR|Brave/.test(ua);
}

export const addPWAInstallPrompt = () => {
    if (!isChrome())
        return;

    let deferredPrompt: BeforeInstallPromptEvent | null;
    const installBtn = document.getElementById('installBtn') as HTMLElement | null;
    if (!installBtn)
        return;

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e: unknown) => {
        const event = e as BeforeInstallPromptEvent;
        event.preventDefault(); // Prevent automatic prompt
        deferredPrompt = event; // Save the event for later
        installBtn.style.display = 'block'; // Show the install button
    });

    // Handle button click
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt(); // Show the install prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install prompt: ${outcome}`);
            deferredPrompt = null; // Clear the saved prompt
            installBtn.style.display = 'none'; // Hide the button
        }
    });
}