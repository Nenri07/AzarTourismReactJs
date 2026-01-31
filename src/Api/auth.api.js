// // src/Api/auth.api.js
// import { publicAxios, privateAxios } from './axios.js';

// export const authService = {
//   async login({ email, password }) {
//     try {
//       const response = await publicAxios.post('/auth/login', { email, password });
//       const { access_token, user } = response.data;

//       localStorage.setItem('accessToken', access_token);
//       return user;
//     } catch (error) {
//       throw error.response?.data || { message: 'Login failed' };
//     }
//   },

//   async getCurrentUser() {
//     try {
//       const response = await privateAxios.get('/auth/profile');
//       return response.data;
//     } catch (error) {
//       throw error.response?.data || { message: 'Failed to get profile' };
//     }
//   },

//   logout() {
//     localStorage.removeItem('accessToken');
//   },

//   async register(userData) {
//     try {
//       const formData = new FormData();
//       formData.append('email', userData.email);
//       formData.append('password', userData.password);
//       formData.append('fullname', userData.full_name);
//       if (userData.picture) {
//         formData.append('picture', userData.picture);
//       }

//       const response = await publicAxios.post('/auth/signup', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });

//       return response.data;
//     } catch (error) {
//       throw error.response?.data || { message: 'Signup failed' };
//     }
//   },

//   async refresh() {
//     try {
//       const response = await publicAxios.post('/auth/refresh', {}, {
//         headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } // if backend needs old token
//       });
//       const { access_token } = response.data;
//       localStorage.setItem('accessToken', access_token);
//       return access_token;
//     } catch (error) {
//       throw error.response?.data || { message: 'Refresh failed' };
//     }
//   },
// };



// src/Api/auth.api.js
import { publicAxios, privateAxios } from './axios.js';

export const authService = {
  async login({ email, password }) {
    try {
      const response = await publicAxios.post('/auth/login', { email, password });
      const { access_token, refresh_token, user } = response.data;

      // Store tokens
      localStorage.setItem('accessToken', access_token);
      if (refresh_token) {
        localStorage.setItem('refreshToken', refresh_token);
      }
      
      // Store user data
      const userData = { msg: "Welcome", user };
      localStorage.setItem('userData', JSON.stringify(userData));

      return { access_token, user: userData };
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  async getCurrentUser() {
    try {
      const response = await privateAxios.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get profile' };
    }
  },

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
  },

  async register(userData) {
    try {
      const formData = new FormData();
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      formData.append('fullname', userData.full_name);
      if (userData.picture) {
        formData.append('picture', userData.picture);
      }

      const response = await publicAxios.post('/auth/signup', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Signup failed' };
    }
  },

  async refresh() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const accessToken = localStorage.getItem('accessToken');
      
      // Your backend might use refresh_token in body or access_token in header
      const response = await publicAxios.post('/auth/refresh', 
        { refresh_token: refreshToken },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      const { access_token } = response.data;
      localStorage.setItem('accessToken', access_token);
      return access_token;
    } catch (error) {
      throw error.response?.data || { message: 'Refresh failed' };
    }
  },
};