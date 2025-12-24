document.getElementById('downloadBtn').addEventListener('click', function () {
    const card = document.getElementById('cardToCapture');

    // Use html2canvas to capture the card div
    html2canvas(card, {
        scale: 2, // High resolution
        backgroundColor: '#FFFFFF', // Ensure white background
        useCORS: true // Allow loading external images if needed (local files might need server)
    }).then(canvas => {
        // Create a download link
        const link = document.createElement('a');
        link.download = 'HolidayCard.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(err => {
        console.error("Could not generate image:", err);
        alert("Oops! Something went wrong generating your card. Please try again.");
    });
});
