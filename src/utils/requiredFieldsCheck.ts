export const marketPlaceRequiredFields = (providerData: any) => {
    const {username, phoneNumber, description, hourlyRate, languages, offeredServices, serviceArea } = providerData;
    
    // Check if all required fields exist
    if (!username || !phoneNumber || !description || !hourlyRate || !languages || !offeredServices || !serviceArea) {
        return false;
    }

    // Validate username length
    if (username.length < 3) {
        return false;
    }

    // Validate phone number length
    if (phoneNumber.length < 10) {
        return false;
    }

    // Validate description length
    if (description.length < 10) {
        return false;
    }

    // Validate hourly rate (should be greater than 0)
    if (!hourlyRate || hourlyRate <= 0) {
        return false;
    }
    
    // Validate arrays are not empty
    if (languages.length === 0 || offeredServices.length === 0 || serviceArea.length === 0) {
        return false;
    }

    return true;
};