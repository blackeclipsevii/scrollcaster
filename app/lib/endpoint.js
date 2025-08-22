const params = new URLSearchParams(window.location.search);
export let hostname = "https://army-thing.fly.dev";
export let port = null;
if (params.get('localhost')) {
    hostname = 'http://localhost';
    port = 3000;
}
export const endpoint = port ? `${hostname}:${port}` : hostname;
