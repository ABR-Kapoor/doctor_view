// AuraSutra - Utility Functions
import type {
    MedicationAdherence,
    MedicationChartData,
    AdherenceDonutData,
    Appointment,
    AppointmentTimelineData,
} from './types';

// ==================== DATE/TIME UTILITIES ====================

export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

export function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return formatDate(dateString);
}

export function isToday(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

export function isFutureDate(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();
    return date > now;
}

// ==================== CHART DATA TRANSFORMERS ====================

export function transformMedicationToChartData(
    adherenceData: MedicationAdherence[]
): MedicationChartData[] {
    const dateMap = new Map<string, { taken: number; skipped: number; total: number }>();

    adherenceData.forEach((item) => {
        const existing = dateMap.get(item.scheduled_date) || { taken: 0, skipped: 0, total: 0 };

        dateMap.set(item.scheduled_date, {
            taken: existing.taken + (item.is_taken ? 1 : 0),
            skipped: existing.skipped + (item.is_skipped ? 1 : 0),
            total: existing.total + 1,
        });
    });

    return Array.from(dateMap.entries())
        .map(([date, stats]) => ({
            date: formatDate(date),
            ...stats,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-30); // Last 30 days
}

export function calculateAdherenceDonutData(
    adherenceData: MedicationAdherence[]
): AdherenceDonutData[] {
    const medicineMap = new Map<string, { taken: number; total: number }>();

    adherenceData.forEach((item) => {
        const existing = medicineMap.get(item.medicine_name) || { taken: 0, total: 0 };

        medicineMap.set(item.medicine_name, {
            taken: existing.taken + (item.is_taken ? 1 : 0),
            total: existing.total + 1,
        });
    });

    return Array.from(medicineMap.entries()).map(([name, stats]) => ({
        name,
        value: stats.taken,
        percentage: Math.round((stats.taken / stats.total) * 100),
    }));
}

export function transformAppointmentsToTimeline(
    appointments: Appointment[]
): AppointmentTimelineData[] {
    return appointments
        .map((apt) => ({
            aid: apt.aid,
            date: apt.scheduled_date,
            time: apt.scheduled_time,
            doctor_name: apt.doctor?.user?.name || 'Unknown Doctor',
            status: apt.status,
            mode: apt.mode,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ==================== VALIDATION ====================

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
}

// ==================== NUMBER FORMATTING ====================

export function formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-IN').format(num);
}

// ==================== STRING UTILITIES ====================

export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

export function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// ==================== STATUS HELPERS ====================

export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        scheduled: 'text-blue-600 bg-blue-100',
        confirmed: 'text-green-600 bg-green-100',
        rescheduled: 'text-yellow-600 bg-yellow-100',
        in_progress: 'text-indigo-600 bg-indigo-100',
        completed: 'text-emerald-600 bg-emerald-100',
        cancelled: 'text-red-600 bg-red-100',
        pending: 'text-amber-600 bg-amber-100',
        paid: 'text-green-600 bg-green-100',
        failed: 'text-red-600 bg-red-100',
    };

    return colors[status] || 'text-gray-600 bg-gray-100';
}

export function getStatusBadge(status: string): string {
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`;
}

// ==================== LOCAL STORAGE ====================

export function setLocalStorage<T>(key: string, value: T): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
    }
}

export function getLocalStorage<T>(key: string): T | null {
    if (typeof window !== 'undefined') {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }
    return null;
}

export function removeLocalStorage(key: string): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
    }
}
