import axios from 'axios';

export async function fetchLatestVersion(packageName) {
    try {
        const response = await axios.get(`https://registry.npmjs.org/${packageName}/latest`);
        return response.data.version;
    } catch (error) {
        console.error(`Failed to fetch the latest version for ${packageName}:`, error);
        return null; // Return null if fetching fails
    }
}
