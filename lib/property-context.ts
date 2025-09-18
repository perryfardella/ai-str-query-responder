// Fictional Airbnb property information for AI context
// This will eventually be replaced with real property data from the database

export interface PropertyContext {
    name: string;
    address: string;
    description: string;
    wifi: {
        network: string;
        password: string;
    };
    checkin: {
        time: string;
        instructions: string;
        keyLocation: string;
    };
    checkout: {
        time: string;
        instructions: string;
    };
    amenities: string[];
    houseRules: string[];
    emergencyContact: {
        name: string;
        phone: string;
        relationship: string;
    };
    localInfo: {
        trashDays: string[];
        nearbyRestaurants: Array<{
            name: string;
            type: string;
            walkingTime: string;
            description: string;
        }>;
        attractions: Array<{
            name: string;
            type: string;
            distance: string;
            description: string;
        }>;
        transportation: {
            parking: string;
            publicTransport: string;
            airport: string;
        };
    };
    appliances: {
        tv: string;
        kitchen: string[];
        laundry: string;
        heating: string;
        airConditioning: string;
    };
    troubleshooting: {
        wifi: string;
        heating: string;
        appliances: string;
        emergencies: string;
    };
}

// Fictional property data - replace with real data from database
export const defaultPropertyContext: PropertyContext = {
    name: "Sunny Downtown Loft",
    address: "123 Main Street, Downtown, San Francisco, CA 94102",
    description:
        "A beautiful 2-bedroom loft in the heart of downtown with stunning city views and modern amenities.",

    wifi: {
        network: "SunnyLoft_Guest",
        password: "Welcome2024!",
    },

    checkin: {
        time: "3:00 PM",
        instructions:
            "The key is in a lockbox by the front door. The code is 1234. Please text me when you arrive!",
        keyLocation: "Lockbox by front door (code: 1234)",
    },

    checkout: {
        time: "11:00 AM",
        instructions:
            "Please leave the key in the lockbox, turn off all lights and AC, and lock the door. No need to strip beds or wash dishes.",
    },

    amenities: [
        "High-speed WiFi",
        "Smart TV with Netflix",
        "Full kitchen with dishwasher",
        "Washer and dryer",
        "Air conditioning",
        "Heating",
        "Iron and ironing board",
        "Hair dryer",
        "Fresh linens and towels",
        "Coffee maker and basic coffee/tea",
        "Parking space included",
    ],

    houseRules: [
        "No smoking anywhere on the property",
        "No parties or loud noise after 10 PM",
        "Maximum 4 guests",
        "No pets allowed",
        "Please keep the space clean and tidy",
        "Report any damage immediately",
        "No unauthorized guests",
    ],

    emergencyContact: {
        name: "Sarah Johnson",
        phone: "+1 (555) 123-4567",
        relationship: "Property Manager",
    },

    localInfo: {
        trashDays: ["Tuesday", "Friday"],

        nearbyRestaurants: [
            {
                name: "Tony's Italian Bistro",
                type: "Italian",
                walkingTime: "3 minutes",
                description:
                    "Authentic Italian cuisine with great pasta and pizza. Very popular with locals.",
            },
            {
                name: "Green Garden Café",
                type: "Healthy/Vegetarian",
                walkingTime: "5 minutes",
                description:
                    "Fresh salads, smoothies, and healthy options. Great for breakfast and lunch.",
            },
            {
                name: "Dragon Palace",
                type: "Chinese",
                walkingTime: "7 minutes",
                description:
                    "Traditional Chinese restaurant with excellent dim sum and delivery options.",
            },
            {
                name: "Corner Coffee Co.",
                type: "Coffee Shop",
                walkingTime: "2 minutes",
                description:
                    "Local coffee shop with great espresso, pastries, and free WiFi.",
            },
        ],

        attractions: [
            {
                name: "Union Square",
                type: "Shopping/Entertainment",
                distance: "0.5 miles",
                description:
                    "Major shopping district with department stores, restaurants, and street performers.",
            },
            {
                name: "Golden Gate Park",
                type: "Park/Recreation",
                distance: "2 miles",
                description:
                    "Large urban park with museums, gardens, and recreational activities.",
            },
            {
                name: "Fisherman's Wharf",
                type: "Tourist Attraction",
                distance: "1.5 miles",
                description:
                    "Famous waterfront area with seafood restaurants, shops, and sea lions.",
            },
            {
                name: "Chinatown",
                type: "Cultural District",
                distance: "0.8 miles",
                description:
                    "Historic neighborhood with authentic Chinese restaurants, shops, and cultural sites.",
            },
        ],

        transportation: {
            parking:
                "One dedicated parking space included in the building garage (Space #12). Access code is 5678.",
            publicTransport:
                "Muni bus stops are 1 block away. BART station is 3 blocks (Montgomery Station).",
            airport:
                "SFO Airport is about 45 minutes by BART or 30-60 minutes by car/rideshare depending on traffic.",
        },
    },

    appliances: {
        tv: "55-inch Samsung Smart TV with Netflix, Hulu, and Amazon Prime already logged in",
        kitchen: [
            "Full-size refrigerator with freezer",
            "Electric stove and oven",
            "Microwave",
            "Dishwasher",
            "Coffee maker (Keurig with pods provided)",
            "Toaster",
            "Basic cookware, plates, and utensils",
        ],
        laundry: "Washer and dryer in unit. Detergent provided.",
        heating: "Central heating - thermostat is in the living room",
        airConditioning: "Central AC - same thermostat as heating",
    },

    troubleshooting: {
        wifi:
            "If WiFi isn't working, unplug the router (white box by the TV) for 30 seconds, then plug back in. Wait 2-3 minutes.",
        heating:
            "Thermostat is in the living room. Set to 'Heat' mode and adjust temperature. If not working, check that it's set to 'Heat' not 'Cool'.",
        appliances:
            "Most appliances have instruction cards nearby. If something isn't working, please text me with details.",
        emergencies:
            "For emergencies, call 911. For urgent property issues, contact Sarah Johnson at (555) 123-4567.",
    },
};

/**
 * Get property context for AI responses
 * In the future, this will fetch real property data from the database
 */
export function getPropertyContext(propertyId?: number): PropertyContext {
    // TODO: Fetch real property data from database using propertyId
    return defaultPropertyContext;
}

/**
 * Format property context for AI prompt
 */
export function formatPropertyContextForAI(context: PropertyContext): string {
    return `
PROPERTY INFORMATION:
Property: ${context.name}
Address: ${context.address}
Description: ${context.description}

WIFI INFORMATION:
Network: ${context.wifi.network}
Password: ${context.wifi.password}

CHECK-IN INFORMATION:
Time: ${context.checkin.time}
Instructions: ${context.checkin.instructions}
Key Location: ${context.checkin.keyLocation}

CHECK-OUT INFORMATION:
Time: ${context.checkout.time}
Instructions: ${context.checkout.instructions}

AMENITIES:
${context.amenities.map((amenity) => `- ${amenity}`).join("\n")}

HOUSE RULES:
${context.houseRules.map((rule) => `- ${rule}`).join("\n")}

EMERGENCY CONTACT:
Name: ${context.emergencyContact.name}
Phone: ${context.emergencyContact.phone}
Role: ${context.emergencyContact.relationship}

LOCAL INFORMATION:
Trash Collection: ${context.localInfo.trashDays.join(" and ")}

Nearby Restaurants:
${
        context.localInfo.nearbyRestaurants.map((restaurant) =>
            `- ${restaurant.name} (${restaurant.type}) - ${restaurant.walkingTime} walk: ${restaurant.description}`
        ).join("\n")
    }

Nearby Attractions:
${
        context.localInfo.attractions.map((attraction) =>
            `- ${attraction.name} (${attraction.type}) - ${attraction.distance}: ${attraction.description}`
        ).join("\n")
    }

TRANSPORTATION:
Parking: ${context.localInfo.transportation.parking}
Public Transport: ${context.localInfo.transportation.publicTransport}
Airport: ${context.localInfo.transportation.airport}

APPLIANCES & TV:
TV: ${context.appliances.tv}
Kitchen: ${context.appliances.kitchen.join(", ")}
Laundry: ${context.appliances.laundry}
Heating: ${context.appliances.heating}
Air Conditioning: ${context.appliances.airConditioning}

TROUBLESHOOTING:
WiFi Issues: ${context.troubleshooting.wifi}
Heating Issues: ${context.troubleshooting.heating}
Appliance Issues: ${context.troubleshooting.appliances}
Emergencies: ${context.troubleshooting.emergencies}
`.trim();
}
