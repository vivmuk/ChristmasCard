let userImage = new Image();
let generatedImage = new Image();

document.getElementById('imageInput').addEventListener('change', handleImageUpload);

function updateStatus(message) {
    const badge = document.getElementById('statusBadge');
    badge.textContent = message;
    console.log(message);
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            userImage.onload = () => {
                updateStatus('Photo loaded!');
                // Update the thumbnail at bottom right
                document.getElementById('thumbImg').src = event.target.result;
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
        alert("Please upload a photo first");
        return;
    }

    const btn = document.querySelector('.generate-btn');
    btn.disabled = true;
    updateStatus('Painting your scene...');

    try {
        // Venice AI Image Edit API
        const genImageUrl = await generateStylizedImage(apiKey, userImage.src);

        // Load the result onto the canvas
        generatedImage.crossOrigin = "anonymous";
        generatedImage.onload = () => {
            const canvas = document.getElementById('cardCanvas');
            const ctx = canvas.getContext('2d');

            // Show canvas, hide placeholder
            document.getElementById('placeholderText').style.display = 'none';
            canvas.style.display = 'block';

            // Draw to canvas
            canvas.width = generatedImage.width;
            canvas.height = generatedImage.height;
            ctx.drawImage(generatedImage, 0, 0);

            updateStatus('Card ready!');
            btn.disabled = false;
        };
        generatedImage.src = genImageUrl;

    } catch (error) {
        console.error(error);
        updateStatus('Error generating image');
        alert("An error occurred. Please check your API key.");
        btn.disabled = false;
    }
}

async function generateStylizedImage(apiKey, base64Image) {
    const base64Data = base64Image.split(',')[1];

    const response = await fetch('https://api.venice.ai/api/v1/image/edit', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image: base64Data,
            prompt: 'A whimsical, festive watercolor Christmas scene featuring the person in the uploaded image. Snowy wonderland background, twinkling lights, pine trees, artistic watercolor style, soft edges, festive atmosfera, preserve person likeness.',
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`API Error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return data.url || (data.data && data.data[0].url) || (data.images && data.images[0].url);
}

// Global capture for download
document.getElementById('downloadBtn').addEventListener('click', function () {
    const card = document.getElementById('cardToCapture');
    updateStatus('Generating download...');

    html2canvas(card, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fffaf0'
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'FestiveHolidayCard.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        updateStatus('Downloaded!');
    }).catch(err => {
        console.error(err);
        updateStatus('Download failed');
    });
});
