// utils/apiRequest.js
export async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const token = localStorage.getItem('access');
        const url = endpoint.startsWith('http') ? endpoint : `http://127.0.0.1:8000/api${endpoint}`;
        
        console.log(`🔵 API Request: ${method} ${url}`, data || '');
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (data && method !== 'GET' && method !== 'DELETE') {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        
        console.log(`🟢 API Response: ${response.status} ${url}`);
        
        // Handle 401 Unauthorized (token expired)
        if (response.status === 401) {
            console.warn('Token expired, attempting refresh...');
            const refreshSuccess = await refreshToken();
            if (refreshSuccess) {
                // Retry with new token
                options.headers['Authorization'] = `Bearer ${localStorage.getItem('access')}`;
                const retryResponse = await fetch(url, options);
                if (!retryResponse.ok) {
                    throw new Error(`Retry failed: ${retryResponse.status}`);
                }
                return await processResponse(retryResponse);
            } else {
                // Refresh failed, redirect to login
                localStorage.removeItem('access');
                localStorage.removeItem('refresh');
                localStorage.removeItem('user');
                window.location.hash = '#/login';
                throw new Error('Session expired, please login again');
            }
        }
        
        // Handle other error statuses
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorData.message || errorMessage;
                if (errorData.errors) {
                    errorMessage = Object.values(errorData.errors).flat().join(', ');
                }
            } catch {
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        // Handle empty responses (204 No Content)
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return { success: true, message: 'Operation completed successfully' };
        }
        
        // Parse and return response
        return await processResponse(response);
        
    } catch (error) {
        console.error('❌ API Request Error:', error);
        throw error;
    }
}

async function processResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
        return await response.json();
    }
    
    const text = await response.text();
    if (text) {
        try {
            return JSON.parse(text);
        } catch {
            return { data: text, success: true };
        }
    }
    
    return { success: true };
}

async function refreshToken() {
    try {
        const refreshToken = localStorage.getItem('refresh');
        if (!refreshToken) return false;
        
        const response = await fetch('http://127.0.0.1:8000/api/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access', data.access);
            console.log('✅ Token refreshed successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Token refresh failed:', error);
        return false;
    }
}

// Helper for GET requests
export async function getAPI(url) {
    return await apiRequest(url, 'GET');
}

// Helper for POST requests
export async function postAPI(url, data) {
    return await apiRequest(url, 'POST', data);
}

// Helper for PUT requests
export async function putAPI(url, data) {
    return await apiRequest(url, 'PUT', data);
}

// Helper for PATCH requests
export async function patchAPI(url, data) {
    return await apiRequest(url, 'PATCH', data);
}

// Helper for DELETE requests
export async function deleteAPI(url) {
    return await apiRequest(url, 'DELETE');
}