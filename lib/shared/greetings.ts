// Dynamic greeting messages
export const greetings = [
    "Welcome back",
    "Great to see you",
    "Hello",
    "Good to have you here",
    "Welcome",
    "Hey there",
    "Greetings",
    "Nice to see you",
];

export function getRandomGreeting(): string {
    return greetings[Math.floor(Math.random() * greetings.length)];
}

export function getTimeBasedGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Good night";
}

export function getDynamicGreeting(): string {
    // 50% chance to use time-based, 50% random
    return Math.random() > 0.5 ? getTimeBasedGreeting() : getRandomGreeting();
}
