const fetch = require('node-fetch');

async function checkEvents() {
    try {
        const response = await fetch('http://localhost:3000/api/events');
        const events = await response.json();
        
        console.log("Total events:", events.length);
        console.log("Current Server Time:", new Date().toISOString());
        
        events.forEach(e => {
            console.log(`Event: ${e.name}`);
            console.log(`  Date: ${e.date}`);
            console.log(`  IsActive: ${e.isActive}`);
            console.log(`  Is Past? ${new Date(e.date) < new Date()}`);
        });
    } catch (error) {
        console.error("Error:", error);
    }
}

checkEvents();
