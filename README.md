# RentMed Healthcare WhatsApp Bot

Automated WhatsApp bot for RentMed Healthcare Support using whatsapp-web.js.

## Features

- Automated customer support responses
- Product quote requests with detailed information
- Delivery/pickup address collection
- General enquiry handling
- Persistent user sessions
- Natural typing delays for better user experience
- PM2 process management for production deployment

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- WhatsApp account for bot

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create logs directory:

```bash
mkdir logs
```

## Running the Bot

### Development Mode

```bash
npm start
```

On first run, a QR code will appear in the terminal. Scan it with WhatsApp:
1. Open WhatsApp on your phone
2. Go to Settings > Linked Devices
3. Tap "Link a Device"
4. Scan the QR code displayed in terminal

### Production Mode with PM2

Start the bot:
```bash
npm run pm2:start
```

View logs:
```bash
npm run pm2:logs
```

Restart the bot:
```bash
npm run pm2:restart
```

Stop the bot:
```bash
npm run pm2:stop
```

## Bot Flow

1. **Initial Contact**: User receives welcome message and is asked for their name
2. **Main Menu**: After providing name, user sees 3 options:
   - Quote request
   - Delivery or pickup
   - General enquiry

3. **Quote Request**: Shows 7 product options with detailed information
4. **Delivery/Pickup**: Collects user address and confirms team will call
5. **General Enquiry**: Directs to enquiries@rentmed.co.za

## Products

1. Care bed rental Omega
2. Care bed & overbed table
3. Ripple air mattress rental
4. Bubble air mattress rental
5. Standard wheelchair
6. Heavy duty wheelchair
7. Electric hoist rental

## Session Management

User sessions are stored in memory using a Map structure. Each session tracks:
- User's name
- Current conversation state
- Previous interactions

Sessions persist for the lifetime of the bot process.

## Deployment Notes

- The bot uses LocalAuth for persistent WhatsApp sessions
- QR code only needs to be scanned once
- Session data is stored in `.wwebjs_auth` directory
- PM2 ensures the bot restarts automatically on crashes
- Logs are stored in `logs/` directory

## Troubleshooting

**QR Code doesn't appear:**
- Ensure no other WhatsApp Web sessions are active
- Delete `.wwebjs_auth` folder and restart

**Bot doesn't respond:**
- Check PM2 logs: `npm run pm2:logs`
- Verify WhatsApp session is still active
- Restart the bot: `npm run pm2:restart`

**Messages delayed:**
- Typing delays are intentional (1-2 seconds) for natural feel
- Can be adjusted in `bot.js` by modifying the `delay()` calls

## Support

For issues or questions, contact: enquiries@rentmed.co.za
