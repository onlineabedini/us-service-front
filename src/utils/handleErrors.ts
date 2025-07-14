export const handleError = (error: any) => {
    let errorMessage = "An unknown error occurred.";
    if (error.code === 400) {
        errorMessage = error.message;
    } else if (error.code === 401) {
        errorMessage = error.message;
    } else if (error.code === 403) {
        errorMessage = error.message;
    } else if (error.code === 404) {
        errorMessage = error.message;
    } else if (error.code === 500) {
        errorMessage = error.message;
    } else {
        errorMessage = "An unknown error occurred.";
    }
    return errorMessage;
};

// Short comment: Handle structured error messages from backend API responses
export const handleApiError = (error: any, t?: any) => {
    let errorMessage = t?.("deleteAccountError") || "Failed to delete account.";
    let errorDescription = t?.("deleteAccountErrorDescription") || "An error occurred. Please try again.";
    
    // Handle structured error objects from our services
    if (error && typeof error === 'object') {
        if (error.message) {
            // Check for specific error scenarios
            if (error.message.includes("active bookings")) {
                errorMessage = t?.("deleteAccountActiveBookingsError") || 
                    "Cannot delete account: You have active bookings. Please complete or cancel all bookings before deleting your account.";
            } else if (error.message.includes("pending requests")) {
                errorMessage = t?.("deleteAccountPendingRequestsError") || 
                    "Cannot delete account: You have pending requests. Please resolve all pending requests before deleting your account.";
            } else if (error.message.includes("unpaid invoices")) {
                errorMessage = t?.("deleteAccountUnpaidInvoicesError") || 
                    "Cannot delete account: You have unpaid invoices. Please settle all outstanding payments before deleting your account.";
            } else {
                // Use the specific error message from backend
                errorMessage = error.message;
            }
        }
        
        // Handle status code specific messages
        if (error.statusCode) {
            switch (error.statusCode) {
                case 400:
                    errorDescription = "Bad request. Please check your input and try again.";
                    break;
                case 401:
                    errorDescription = "Authentication required. Please log in again.";
                    break;
                case 403:
                    errorDescription = "Access denied. You don't have permission to perform this action.";
                    break;
                case 404:
                    errorDescription = "Resource not found. Please check the URL and try again.";
                    break;
                case 409:
                    errorDescription = "Conflict. The resource cannot be deleted due to existing dependencies.";
                    break;
                case 500:
                    errorDescription = "Server error. Please try again later or contact support.";
                    break;
                default:
                    errorDescription = "An unexpected error occurred. Please try again.";
            }
        }
    }
    
    return {
        message: errorMessage,
        description: errorDescription
    };
};

