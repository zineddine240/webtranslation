async function trigger() {
    try {
        const response = await fetch('http://localhost:5173/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/' })
        });
        const data = await response.json();
        console.log('Response:', data);
    } catch (e) {
        console.error('Trigger failed:', e);
    }
}
trigger();
