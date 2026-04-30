const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

const userSessions = new Map();
let botStartTime = null;

// Blocklist - Users in this list will not receive responses
const BLOCKED_USERS = [
    '88541170254042@lid',
    '190662339219472@lid',
    '120363233839420953@g.us'
];

const STATES = {
    AWAITING_NAME: 'AWAITING_NAME',
    AWAITING_MAIN_MENU: 'AWAITING_MAIN_MENU',
    AWAITING_PRODUCT_CHOICE: 'AWAITING_PRODUCT_CHOICE',
    AWAITING_PRODUCT_SECONDARY_MENU: 'AWAITING_PRODUCT_SECONDARY_MENU',
    AWAITING_DELIVERY_PICKUP_SUBMENU: 'AWAITING_DELIVERY_PICKUP_SUBMENU',
    AWAITING_PICKUP_DETAILS: 'AWAITING_PICKUP_DETAILS',
    AWAITING_WHEELCHAIR_DELIVERY_PICKUP: 'AWAITING_WHEELCHAIR_DELIVERY_PICKUP',
    AWAITING_GENERAL_ENQUIRY_MENU: 'AWAITING_GENERAL_ENQUIRY_MENU'
};

const PRODUCTS = {
    1: {
        name: 'Care bed rental Omega-5',
        info: 'Thank you for your care bed rental enquiry. We offer care bed rentals via two primary methods:\n\n- Private rentals\n- Medical Aid Scheme rentals\n\nKindly see the attached files which explains how both of the above methods work.\n\nTo proceed with a quotation request please send us an email at the below email address and one of our team members will be in touch shortly:\n\nenquiries@rentmed.co.za\n\nKind regards\nRentMed Healthcare😊',
        pdfFiles: [
            'RentMed Healthcare Flyer - 2026.pdf',
            'RentMed Healthcare - Private care bed rental.pdf',
            'RentMed Healthare - Care bed rental via Medical Aid.pdf'
        ]
    },
    2: {
        name: 'Care bed & overbed table',
        info: 'Thank you for your care bed and overbed table rental enquiry. We offer rentals via two primary methods:\n\n- Private rentals\n- Medical Aid Scheme rentals\n\nKindly see the attached files which explains how both of the above methods work.\n\nTo proceed with a quotation request please send us an email at the below email address and one of our team members will be in touch shortly:\n\nenquiries@rentmed.co.za\n\nKind regards\nRentMed Healthcare😊',
        pdfFiles: [
            'RentMed Healthcare Flyer - 2026.pdf',
            'RentMed Healthcare - Private care bed rental.pdf',
            'RentMed Healthare - Care bed rental via Medical Aid.pdf'
        ]
    },
    3: {
        name: 'Ripple air mattress rental',
        info: 'Thank you for your enquiry about a Ripple air mattress rental.\n\nKindly see more details in the document attached here.\n\nTo proceed with a quotation request please send us an email at the below email address and one of our team members will be in touch shortly:\nenquiries@rentmed.co.za\n\nKind regards, RentMed Healthcare😊',
        pdfFile: 'Ripple Air Mattress.jpg'
    },
    4: {
        name: 'Bubble air mattress rental',
        info: 'Thank you for your enquiry about a bubble air mattress rental.\n\nKindly see the details on rental rates and terms in the document attached here.\n\nTo proceed with booking a bubble air mattress please send us an email at the below email address and one of our team members will be in touch shortly:\nenquiries@rentmed.co.za\n\nKind regards, RentMed Healthcare😊',
        pdfFile: 'Bubble Air Mattress.jpg'
    },
    5: {
        name: 'Standard wheelchair',
        info: 'Thank you for your enquiry about a standard wheelchair rental.\n\nKindly see the details on rental rates and terms in the document attached here.\n\nTo proceed with booking a rental wheelchair please send us an email at the below email address and one of our team members will be in touch shortly:\nenquiries@rentmed.co.za\n\nKind regards, RentMed Healthcare😊',
        pdfFile: 'Standard wheelchair.jpg'
    },
    6: {
        name: 'Heavy duty wheelchair',
        info: 'Thank you for your enquiry about a heavy duty wheelchair rental.\n\nKindly see the details on rental rates and terms in the document attached here.\n\nTo proceed with booking a rental wheelchair please send us an email at the below email address and one of our team members will be in touch shortly:\nenquiries@rentmed.co.za\n\nKind regards, RentMed Healthcare😊',
        pdfFile: 'Heavy duty wheelchair.jpg'
    },
    7: {
        name: 'Electric hoist rental',
        info: 'Thank you for your electric hoist rental enquiry. We offer rentals via two primary methods:\n\n- Private rentals\n- Medical Aid Scheme rentals\n\nKindly see the attached file which explains how both of the above methods work.\n\nTo proceed with a quotation request please send us an email at the below email address and one of our team members will be in touch shortly:\n\nenquiries@rentmed.co.za\n\nKind regards\nRentMed Healthcare😊',
        pdfFile: 'Electric Patient Hoist.jpg'
    }
};

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendWithTyping(msg, text, delayMs = 1500) {
    await msg.getChat().then(chat => chat.sendStateTyping());
    await delay(delayMs);
    await msg.reply(text);
}

async function sendWithFile(msg, text, filePath, delayMs = 1500) {
    const chat = await msg.getChat();
    await chat.sendStateTyping();
    await delay(delayMs);

    try {
        const fileExists = fs.existsSync(filePath);
        if (fileExists) {
            const media = MessageMedia.fromFilePath(filePath);
            await chat.sendMessage(media, { caption: text });
        } else {
            await msg.reply(text);
        }
    } catch (error) {
        console.error('Error sending file:', error);
        await msg.reply(text);
    }
}

async function sendWithMultipleFiles(msg, text, filePaths, delayMs = 1500) {
    const chat = await msg.getChat();
    await chat.sendStateTyping();
    await delay(delayMs);

    try {
        // Send the text message first
        await msg.reply(text);

        // Then send each file
        for (const filePath of filePaths) {
            const fullPath = path.join(__dirname, 'documents', filePath);
            if (fs.existsSync(fullPath)) {
                const media = MessageMedia.fromFilePath(fullPath);
                await chat.sendMessage(media);
                await delay(500); // Small delay between files
            } else {
                console.log(`File not found: ${fullPath}`);
            }
        }
    } catch (error) {
        console.error('Error sending files:', error);
        // If sending files fails, at least the text message was sent
    }
}

function getUserSession(userId) {
    if (!userSessions.has(userId)) {
        console.log('🆕 New user session created for:', userId);
        userSessions.set(userId, {
            state: STATES.AWAITING_NAME,
            name: null,
            selectedProduct: null,
            greeted: false
        });
    }
    return userSessions.get(userId);
}

function getMainMenuText() {
    return `Please select an option by typing the number:\n\n1. Quote request\n2. Delivery or pickup\n3. General enquiry\n4. Any of the above`;
}

function getProductListText() {
    return `Please select a product by typing the number:\n\n1. Care bed rental Omega-5\n2. Care bed & overbed table\n3. Ripple air mattress rental\n4. Bubble air mattress rental\n5. Standard wheelchair\n6. Heavy duty wheelchair\n7. Electric hoist rental\n\nType 0 to return to main menu`;
}

function getProductSecondaryMenuText() {
    return `What would you like to do next?\n\n1. Rental extension\n2. Billing enquiry\n3. General enquiry\n4. None of the above`;
}

function getDeliveryPickupSubmenuText() {
    return `Please select an option:\n\n1. Delivery enquiry\n2. Pickup request`;
}

function getWheelchairDeliveryPickupText() {
    return `Would you like information about:\n\n1. Delivery\n2. Pickup\n\nType 0 to return to main menu`;
}

function getGeneralEnquiryMenuText() {
    return `Please select an option:\n\n1. Rental extension\n2. Billing enquiry\n3. General enquiry\n4. None of the above`;
}

async function handleMessage(msg) {
    if (msg.from === 'status@broadcast') return;

    const userId = msg.from;

    // Check if user is blocked
    if (BLOCKED_USERS.includes(userId)) {
        console.log('🚫 Blocked user attempted to message:', userId);
        return; // Don't respond to blocked users
    }

    const userMessage = msg.body.trim();
    const session = getUserSession(userId);

    // Log user details for debugging/copying
    console.log('\n📱 Message received:');
    console.log('   User ID:', userId);
    console.log('   Message:', userMessage);
    console.log('   Timestamp:', new Date().toLocaleString());

    try {
        switch (session.state) {
            case STATES.AWAITING_NAME:
                // Only process if they've already seen the greeting
                if (session.greeted) {
                    session.name = userMessage;
                    session.state = STATES.AWAITING_MAIN_MENU;
                    await sendWithTyping(
                        msg,
                        `Thank you ${session.name}! 😊\n\n${getMainMenuText()}`
                    );
                } else {
                    // First time - send greeting and mark as greeted
                    session.greeted = true;
                    await sendWithTyping(
                        msg,
                        'Thank you for contacting RentMed Healthcare 😊\n\nOne of our specialist team members will assist you shortly.\n\nMay I have your name?'
                    );
                }
                break;

            case STATES.AWAITING_MAIN_MENU:
                const mainChoice = parseInt(userMessage);

                if (mainChoice === 1) {
                    session.state = STATES.AWAITING_PRODUCT_CHOICE;
                    await sendWithTyping(msg, getProductListText());
                } else if (mainChoice === 2) {
                    session.state = STATES.AWAITING_DELIVERY_PICKUP_SUBMENU;
                    await sendWithTyping(msg, getDeliveryPickupSubmenuText());
                } else if (mainChoice === 3) {
                    session.state = STATES.AWAITING_GENERAL_ENQUIRY_MENU;
                    await sendWithTyping(msg, getGeneralEnquiryMenuText());
                } else if (mainChoice === 4) {
                    await sendWithTyping(
                        msg,
                        'For general enquiries, please email us at: enquiries@rentmed.co.za\n\nPlease note: Billing queries typically take 3-5 working days to process.'
                    );
                    await delay(1000);
                    await sendWithTyping(
                        msg,
                        `Thank you for contacting RentMed Healthcare! One of our specialist team members will assist you shortly. 😊\n\nIs there anything else I can help you with?\n\n${getMainMenuText()}`,
                        1000
                    );
                } else {
                    await sendWithTyping(
                        msg,
                        `I didn't understand that. ${getMainMenuText()}`,
                        1000
                    );
                }
                break;

            case STATES.AWAITING_PRODUCT_CHOICE:
                const productChoice = parseInt(userMessage);

                if (productChoice === 0) {
                    session.state = STATES.AWAITING_MAIN_MENU;
                    await sendWithTyping(msg, getMainMenuText());
                } else if (PRODUCTS[productChoice]) {
                    const product = PRODUCTS[productChoice];
                    session.selectedProduct = productChoice;

                    // Check if product has multiple PDFs or single file
                    if (product.pdfFiles) {
                        // Send multiple files for care bed options
                        await sendWithMultipleFiles(msg, product.info, product.pdfFiles);
                    } else if (product.pdfFile) {
                        // Send single file for other products
                        let filePath = path.join(__dirname, 'documents', product.pdfFile);
                        // If specific file doesn't exist, fallback to general PDF
                        if (!fs.existsSync(filePath)) {
                            filePath = path.join(__dirname, 'documents', 'rental_methods.pdf');
                            if (!fs.existsSync(filePath)) {
                                filePath = path.join(__dirname, 'documents', 'rental_methods.txt');
                            }
                        }
                        await sendWithFile(msg, product.info, filePath);
                    } else {
                        // No files specified, just send the message
                        await sendWithTyping(msg, product.info);
                    }

                    await delay(1000);

                    if (productChoice === 6) {
                        session.state = STATES.AWAITING_WHEELCHAIR_DELIVERY_PICKUP;
                        await sendWithTyping(
                            msg,
                            `Thank you for your interest in ${product.name}! 😊\n\n${getWheelchairDeliveryPickupText()}`,
                            1000
                        );
                    } else {
                        session.state = STATES.AWAITING_PRODUCT_SECONDARY_MENU;
                        await sendWithTyping(
                            msg,
                            `Thank you for your interest in ${product.name}! Our team will contact you shortly to discuss your requirements. 😊\n\n${getProductSecondaryMenuText()}`,
                            1000
                        );
                    }
                } else {
                    await sendWithTyping(
                        msg,
                        `Invalid selection. ${getProductListText()}`,
                        1000
                    );
                }
                break;

            case STATES.AWAITING_PRODUCT_SECONDARY_MENU:
                const secondaryChoice = parseInt(userMessage);

                if (secondaryChoice === 1) {
                    await sendWithTyping(
                        msg,
                        'For rental extension requests, please email us at: enquiries@rentmed.co.za with your current rental details.\n\nOur team will process your request and get back to you shortly. 😊'
                    );
                    await delay(1000);
                    session.state = STATES.AWAITING_MAIN_MENU;
                    await sendWithTyping(
                        msg,
                        `Thank you for contacting RentMed Healthcare!\n\nIs there anything else I can help you with?\n\n${getMainMenuText()}`,
                        1000
                    );
                } else if (secondaryChoice === 2) {
                    await sendWithTyping(
                        msg,
                        'For billing enquiries, please email us at: enquiries@rentmed.co.za\n\nPlease note: Billing queries typically take 3-5 working days to process.'
                    );
                    await delay(1000);
                    session.state = STATES.AWAITING_MAIN_MENU;
                    await sendWithTyping(
                        msg,
                        `Thank you for contacting RentMed Healthcare! 😊\n\nIs there anything else I can help you with?\n\n${getMainMenuText()}`,
                        1000
                    );
                } else if (secondaryChoice === 3) {
                    await sendWithTyping(
                        msg,
                        'For general enquiries, please email us at: enquiries@rentmed.co.za\n\nOur team will assist you shortly. 😊'
                    );
                    await delay(1000);
                    session.state = STATES.AWAITING_MAIN_MENU;
                    await sendWithTyping(
                        msg,
                        `Thank you for contacting RentMed Healthcare!\n\nIs there anything else I can help you with?\n\n${getMainMenuText()}`,
                        1000
                    );
                } else if (secondaryChoice === 4) {
                    session.state = STATES.AWAITING_PRODUCT_CHOICE;
                    await sendWithTyping(
                        msg,
                        `No problem! Feel free to browse our other products. 😊\n\n${getProductListText()}`,
                        1000
                    );
                } else {
                    await sendWithTyping(
                        msg,
                        `I didn't understand that. ${getProductSecondaryMenuText()}`,
                        1000
                    );
                }
                break;

            case STATES.AWAITING_DELIVERY_PICKUP_SUBMENU:
                const deliveryPickupChoice = parseInt(userMessage);

                if (deliveryPickupChoice === 1) {
                    await sendWithTyping(
                        msg,
                        'Kindly send us an email at the following email address with more details about your request:\n\nenquiries@rentmed.co.za\n\nKind regards\nRentMed Healthcare😊'
                    );
                    await delay(1000);
                    session.state = STATES.AWAITING_MAIN_MENU;
                    await sendWithTyping(
                        msg,
                        `Is there anything else I can help you with?\n\n${getMainMenuText()}`,
                        1000
                    );
                } else if (deliveryPickupChoice === 2) {
                    session.state = STATES.AWAITING_PICKUP_DETAILS;
                    await sendWithTyping(
                        msg,
                        'Can you please provide us with the name of whom the pickup is required for, as well as a contact telephone number?'
                    );
                } else {
                    await sendWithTyping(
                        msg,
                        `I didn't understand that. ${getDeliveryPickupSubmenuText()}`,
                        1000
                    );
                }
                break;


            case STATES.AWAITING_PICKUP_DETAILS:
                await sendWithTyping(
                    msg,
                    'Thank you - your pickup request has been scheduled, and one of our team members will phone you shortly to arrange for the pickup.\n\nAll best, with kindness and compassion.\n\nKind regards, RentMed Healthcare😊'
                );
                await delay(1000);
                session.state = STATES.AWAITING_MAIN_MENU;
                await sendWithTyping(
                    msg,
                    `Is there anything else I can help you with?\n\n${getMainMenuText()}`,
                    1000
                );
                break;

            case STATES.AWAITING_GENERAL_ENQUIRY_MENU:
                const generalEnquiryChoice = parseInt(userMessage);

                if (generalEnquiryChoice === 1) {
                    await sendWithTyping(
                        msg,
                        'Thank you for your rental extension request. Kindly email us at the following email address to extend your rental: enquiries@rentmed.co.za\n\nOne of our team members will attend to your request soonest and respond via email.\n\nThank you for your support. Have a good day further.\n\nKind regards, RentMed Healthcare😊'
                    );
                    await delay(1000);
                    session.state = STATES.AWAITING_MAIN_MENU;
                    await sendWithTyping(
                        msg,
                        `Is there anything else I can help you with?\n\n${getMainMenuText()}`,
                        1000
                    );
                } else if (generalEnquiryChoice === 2) {
                    await sendWithTyping(
                        msg,
                        'For any billing enquiries kindly send us an email at the following email address with the details of your request:\nenquiries@rentmed.co.za\n\nBilling & Medical aid queries may take 3 to 5 working days due to scheme processing times.\n\nThank you for your patience.\n\nKind regards, RentMed Healthcare😊'
                    );
                    await delay(1000);
                    session.state = STATES.AWAITING_MAIN_MENU;
                    await sendWithTyping(
                        msg,
                        `Is there anything else I can help you with?\n\n${getMainMenuText()}`,
                        1000
                    );
                } else if (generalEnquiryChoice === 3) {
                    await sendWithTyping(
                        msg,
                        'Kindly send us an email with your enquiry at the following email address and one of our team members will be in touch soonest to assist:\nenquiries@rentmed.co.za\n\nKind regards\nRentMed Healthcare😊'
                    );
                    await delay(1000);
                    session.state = STATES.AWAITING_MAIN_MENU;
                    await sendWithTyping(
                        msg,
                        `Is there anything else I can help you with?\n\n${getMainMenuText()}`,
                        1000
                    );
                } else if (generalEnquiryChoice === 4) {
                    session.state = STATES.AWAITING_MAIN_MENU;
                    await sendWithTyping(
                        msg,
                        `No problem! Let me show you the main menu again.\n\n${getMainMenuText()}`,
                        1000
                    );
                } else {
                    await sendWithTyping(
                        msg,
                        `I didn't understand that. ${getGeneralEnquiryMenuText()}`,
                        1000
                    );
                }
                break;

            case STATES.AWAITING_WHEELCHAIR_DELIVERY_PICKUP:
                const wheelchairChoice = parseInt(userMessage);

                if (wheelchairChoice === 0) {
                    session.state = STATES.AWAITING_MAIN_MENU;
                    await sendWithTyping(msg, getMainMenuText());
                } else if (wheelchairChoice === 1) {
                    await sendWithTyping(
                        msg,
                        'Delivery Information:\nWe offer convenient delivery service for the Heavy Duty Wheelchair to your specified location.\n\nFor delivery scheduling and pricing, please email: enquiries@rentmed.co.za'
                    );
                    await delay(1000);
                    session.state = STATES.AWAITING_PRODUCT_SECONDARY_MENU;
                    await sendWithTyping(
                        msg,
                        getProductSecondaryMenuText(),
                        1000
                    );
                } else if (wheelchairChoice === 2) {
                    await sendWithTyping(
                        msg,
                        'Pickup Information:\nYou can arrange to pick up the Heavy Duty Wheelchair from our location at a time convenient for you.\n\nFor pickup arrangements, please email: enquiries@rentmed.co.za'
                    );
                    await delay(1000);
                    session.state = STATES.AWAITING_PRODUCT_SECONDARY_MENU;
                    await sendWithTyping(
                        msg,
                        getProductSecondaryMenuText(),
                        1000
                    );
                } else {
                    await sendWithTyping(
                        msg,
                        `I didn't understand that. ${getWheelchairDeliveryPickupText()}`,
                        1000
                    );
                }
                break;

            default:
                session.state = STATES.AWAITING_NAME;
                await sendWithTyping(
                    msg,
                    'Thank you for contacting RentMed Healthcare 😊\n\nOne of our specialist team members will assist you shortly.\n\nMay I have your name?'
                );
        }
    } catch (error) {
        console.error('Error handling message:', error);
        await msg.reply('Sorry, something went wrong. Please try again or contact us at enquiries@rentmed.co.za');
    }
}

client.on('qr', (qr) => {
    console.log('\n=== RentMed WhatsApp Bot ===');
    console.log('Scan the QR code below with WhatsApp:\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    botStartTime = Date.now();
    console.log('\n✓ RentMed WhatsApp Bot is ready!');
    console.log(`Logged in as: ${client.info.pushname}`);
    console.log('Bot is now active and listening for messages...\n');
    console.log('Ignoring messages sent before:', new Date(botStartTime).toLocaleString());
});

client.on('authenticated', () => {
    console.log('✓ Authentication successful');
});

client.on('auth_failure', (msg) => {
    console.error('✗ Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
    console.log('✗ Client was disconnected:', reason);
});

client.on('message', async (msg) => {
    // Ignore messages sent before bot started
    if (botStartTime && msg.timestamp) {
        const messageTime = msg.timestamp * 1000; // Convert to milliseconds
        if (messageTime < botStartTime) {
            console.log('Ignoring old message from:', msg.from);
            return;
        }
    }

    await handleMessage(msg);
});

console.log('Starting RentMed WhatsApp Bot...');
client.initialize();

process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await client.destroy();
    process.exit(0);
});
