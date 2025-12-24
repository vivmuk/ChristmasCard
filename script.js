const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 1024;

let userImage = new Image();
let generatedImage = new Image();
let greetingText = "";

document.getElementById('imageInput').addEventListener('change', handleImageUpload);

function log(message) {
    const logs = document.getElementById('logs');
    logs.innerHTML += `> ${message}<br>`;
    logs.scrollTop = logs.scrollHeight;
    console.log(message);
}

function updateStatus(message, type = 'normal') {
    const badge = document.getElementById('statusBadge');
    badge.textContent = message;
    if (type === 'error') {
        badge.style.borderColor = 'var(--error)';
        badge.style.color = 'var(--error)';
    } else {
        badge.style.borderColor = 'var(--quantum-500)';
        badge.style.color = 'var(--quantum-400)';
    }
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            userImage.onload = () => {
                log("Image loaded successfully");
                // Preview original if needed, or just ready state
                updateStatus('Image Ready');
            }
            userImage.src = event.target.result;
        }
        reader.readAsDataURL(file);
    }
}

async function createCard() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    if (!apiKey) {
        alert("Please enter your Venice API Key");
        return;
    }
    if (!userImage.src) {
        alert("Please upload an image first");
        return;
    }

    const btn = document.querySelector('.holo-button');
    btn.disabled = true;

    try {
        // 1. Generate Greeting
        updateStatus('Writing Greeting...');
        log("Generating retro greeting...");
        greetingText = await generateGreeting(apiKey);
        log(`Greeting: "${greetingText}"`);

        // 2. Generate Image
        updateStatus('Painting...');
        log("Transforming image...");
        const genImageUrl = await generateStylizedImage(apiKey, userImage.src);

        // Load generated image
        await new Promise((resolve, reject) => {
            generatedImage.onload = resolve;
            generatedImage.onerror = reject;
            generatedImage.crossOrigin = "anonymous"; // Important for canvas export
            generatedImage.src = genImageUrl;
        });

        // 3. Composite
        updateStatus('Compositing...');
        log("Compositing final card...");
        drawCanvas();

        updateStatus('Complete!');
        document.querySelector('.placeholder-text').style.display = 'none';
        document.querySelector('canvas').style.display = 'block';

    } catch (error) {
        console.error(error);
        log(`ERROR: ${error.message}`);
        updateStatus('Error', 'error');
        alert("An error occurred. Check the logs or your API key.");
    } finally {
        btn.disabled = false;
    }
}

async function generateGreeting(apiKey) {
    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'grok-41-fast',
            messages: [
                { role: 'system', content: 'You are a 1950s advertising copywriter. Write a SINGLE, SHORT, PUNCHY Holiday greeting (max 10 words) full of Atomic Age enthusiasm and retro slang. Do not use quotes.' },
                { role: 'user', content: 'Write a holiday greeting.' }
            ]
        })
    });

    if (!response.ok) throw new Error(`Chat API Error: ${response.status}`);
    const data = await response.json();
    return data.choices[0].message.content.trim();
}

async function generateStylizedImage(apiKey, base64Image) {
    // Note: Venice API Image-to-Image endpoint logic
    // Some endpoints expect the file as multipart/form-data

    // Strip the data:image/xyz;base64, part if present
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await fetch('https://api.venice.ai/api/v1/image/edit', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image: base64Data,
            prompt: 'A 1950s retro-futuristic watercolor holiday card featuring the person in the uploaded image. Seamlessly integrate their face and likeness into the scene as the main character. Atomic age Christmas style, pastel colors, vintage sci-fi aesthetic, festive atmosphere, highly detailed, smooth painting style.',
            // model and strength caused 400 errors, removing them as they might not be supported on this endpoint or need different keys
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Image API Error: ${response.status} - ${err}`);
    }

    // Check if response is binary image (as implied by some external usage examples)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('image')) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    }

    // The response format for Venice usually returns a URL or Base64
    const data = await response.json();

    // Handle both potential response formats (standard OpenAI style)
    if (data.data && data.data[0].url) return data.data[0].url;
    if (data.data && data.data[0].b64_json) return `data:image/png;base64,${data.data[0].b64_json}`;
    if (data.url) return data.url; // Fallback
    if (data.image) return `data:image/png;base64,${data.image}`; // Another potential simple format

    // If we're here, we might have got something else
    console.log("Unexpected Image Response:", data);
    throw new Error("Could not parse image URL from response");
}

function drawCanvas() {
    const canvas = document.getElementById('cardCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // 1. Draw Generated Background
    ctx.drawImage(generatedImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Draw Greeting Text
    ctx.font = 'italic bold 80px "Playfair Display", serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 20;
    ctx.textAlign = 'center';

    // Text Wrapping or simple center
    // Let's put it at the top
    ctx.fillText(greetingText, CANVAS_WIDTH / 2, 150);

    // Signature
    ctx.font = 'italic 40px "Playfair Display", serif';
    ctx.fillText("From Geetika and Vivek", CANVAS_WIDTH / 2, 220);
    ctx.shadowBlur = 0; // Reset

    // 3. Draw Original Image (Small, Bottom Right)
    const smallSize = 250;
    const padding = 50;

    // Create a circular clip or polaroid style? Let's do Polaroid style
    const x = CANVAS_WIDTH - smallSize - padding;
    const y = CANVAS_HEIGHT - smallSize - padding;

    // White border (Polaroid)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - 10, y - 10, smallSize + 20, smallSize + 20);

    // Draw original image
    ctx.drawImage(userImage, x, y, smallSize, smallSize);

    // Caption for original
    ctx.fillStyle = '#333';
    ctx.font = '16px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Original", x + smallSize / 2, y + smallSize + 30);
}
