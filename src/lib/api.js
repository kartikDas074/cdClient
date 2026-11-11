
const API_URL = (
  process.env.BACKEND_URL || "http://localhost:5000"
).replace(/\/+$/, "");

// Common API Request Function
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || "Something went wrong");
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};


// ===================================
// CLUB API FUNCTIONS
// ===================================

// 1. Get All Clubs
export const getAllClubs = async () => {
  return await apiRequest("/api/clubs");
};


// 2. Get Single Club
export const getClubById = async (id) => {
  return await apiRequest(`/api/clubs/${id}`);
};


// 3. Create Club
export const createClub = async (clubData) => {
  return await apiRequest("/api/clubs", {
    method: "POST",
    body: JSON.stringify(clubData),
  });
};


// 4. Update Club
export const updateClub = async (id, updatedData) => {
  return await apiRequest(`/api/clubs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updatedData),
  });
};


// 5. Delete Club
export const deleteClub = async (id) => {
  return await apiRequest(`/api/clubs/${id}`, {
    method: "DELETE",
  });
};


// 6. Update Club Status
export const updateClubStatus = async (id, status) => {
  return await apiRequest(`/api/clubs/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
};


// Get all users
export const getAllUsers = async (params = {}) => {
  const query = new URLSearchParams(params).toString();

  return apiRequest(`/api/users${query ? `?${query}` : ""}`);
};

// Get single user by ID
export const getSingleUser = async (id) => {
  return apiRequest(`/api/users/${id}`);
};

// Get the authenticated user's own profile.
export const getMyProfile = async () => {
  return apiRequest("/api/users/me/profile");
};

// Get the authenticated user's active club memberships.
export const getMyClubs = async () => {
  return apiRequest("/api/users/me/clubs");
};

// Update only the authenticated user's editable profile fields.
export const updateMyProfile = async (profileData) => {
  return apiRequest("/api/users/me/profile", {
    method: "PATCH",
    body: JSON.stringify(profileData),
  });
};

// Update user
export const updateUser = async (id, updatedData) => {
  return apiRequest(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updatedData),
  });
};

// Update a user's role
export const updateUserRole = async (id, role) => {
  return apiRequest(`/api/users/${encodeURIComponent(id)}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
};

// Ban a user
export const banUser = async (id) => {
  return apiRequest(`/api/users/${encodeURIComponent(id)}/ban`, {
    method: "PATCH",
  });
};

// Unban a user
export const unbanUser = async (id) => {
  return apiRequest(`/api/users/${encodeURIComponent(id)}/unban`, {
    method: "PATCH",
  });
};

// Get aggregate user statistics
export const getUserStats = async () => {
  return apiRequest("/api/users/stats");
};



// ===================================
// PROGRAMMING CLUB - CONTEST API
// ===================================

// 1. Get All Contests
export const getAllContests = async () => {
  return await apiRequest("/api/programming/contests");
};

// 2. Get Single Contest
export const getContestById = async (id) => {
  return await apiRequest(`/api/programming/contests/${id}`);
};

// 3. Create Contest
export const createContest = async (contestData) => {
  return await apiRequest("/api/programming/contests", {
    method: "POST",
    body: JSON.stringify(contestData),
  });
};

// 4. Update Contest
export const updateContest = async (id, contestData) => {
  return await apiRequest(`/api/programming/contests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(contestData),
  });
};

// 5. Delete Contest
export const deleteContest = async (id) => {
  return await apiRequest(`/api/programming/contests/${id}`, {
    method: "DELETE",
  });
};


// ===================================
// PROGRAMMING CLUB - RESOURCE API
// ===================================

// 1. Get All Resources
export const getAllResources = async () => {
  return await apiRequest("/api/programming/resources");
};

// 2. Get Single Resource
export const getResourceById = async (id) => {
  return await apiRequest(`/api/programming/resources/${id}`);
};

// 3. Create Resource
export const createResource = async (resourceData) => {
  return await apiRequest("/api/programming/resources", {
    method: "POST",
    body: JSON.stringify(resourceData),
  });
};

// 4. Update Resource
export const updateResource = async (id, resourceData) => {
  return await apiRequest(`/api/programming/resources/${id}`, {
    method: "PATCH",
    body: JSON.stringify(resourceData),
  });
};

// 5. Delete Resource
export const deleteResource = async (id) => {
  return await apiRequest(`/api/programming/resources/${id}`, {
    method: "DELETE",
  });
};


// ===================================
// WEB DEVELOPMENT CLUB - HACKATHON API
// ===================================

// 1. Get All Hackathons
export const getAllWebHackathons = async (params = {}) => {
  const query = new URLSearchParams(params).toString();

  return await apiRequest(
    `/api/web-development/hackathons${query ? `?${query}` : ""}`
  );
};

// 2. Get Single Hackathon
export const getWebHackathonById = async (id) => {
  return await apiRequest(`/api/web-development/hackathons/${id}`);
};

// 3. Create Hackathon
export const createWebHackathon = async (hackathonData) => {
  return await apiRequest("/api/web-development/hackathons", {
    method: "POST",
    body: JSON.stringify(hackathonData),
  });
};

// 4. Update Hackathon
export const updateWebHackathon = async (id, hackathonData) => {
  return await apiRequest(`/api/web-development/hackathons/${id}`, {
    method: "PATCH",
    body: JSON.stringify(hackathonData),
  });
};

// 5. Delete Hackathon
export const deleteWebHackathon = async (id) => {
  return await apiRequest(`/api/web-development/hackathons/${id}`, {
    method: "DELETE",
  });
};



// ===================================
// WEB DEVELOPMENT CLUB - RESOURCE API
// ===================================

// 1. Get All Resources
export const getAllWebResources = async (params = {}) => {
  const query = new URLSearchParams(params).toString();

  return await apiRequest(
    `/api/web-development/resources${query ? `?${query}` : ""}`
  );
};

// 2. Get Single Resource
export const getWebResourceById = async (id) => {
  return await apiRequest(`/api/web-development/resources/${id}`);
};

// 3. Create Resource
export const createWebResource = async (resourceData) => {
  return await apiRequest("/api/web-development/resources", {
    method: "POST",
    body: JSON.stringify(resourceData),
  });
};

// 4. Update Resource
export const updateWebResource = async (id, resourceData) => {
  return await apiRequest(`/api/web-development/resources/${id}`, {
    method: "PATCH",
    body: JSON.stringify(resourceData),
  });
};

// 5. Delete Resource
export const deleteWebResource = async (id) => {
  return await apiRequest(`/api/web-development/resources/${id}`, {
    method: "DELETE",
  });
};



// ===================================
// CLUB MEMBERSHIP API
// ===================================

// ===================================
// 1. USER - SEND CLUB JOIN REQUEST
// POST: /api/clubs/:clubId/join
// ===================================

export const sendClubJoinRequest = async (clubId, message = "") => {
  return await apiRequest(`/api/clubs/${clubId}/join`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
};


// ===================================
// 2. USER - GET MY JOIN REQUESTS
// GET: /api/users/me/join-requests
// ===================================

export const getMyJoinRequests = async () => {
  return await apiRequest("/api/users/me/join-requests");
};


// ===================================
// 3. PRESIDENT - GET CLUB JOIN REQUESTS
// GET: /api/clubs/:clubId/join-requests
// ===================================

export const getClubJoinRequests = async (clubId) => {
  return await apiRequest(`/api/clubs/${clubId}/join-requests`);
};


// ===================================
// 4. PRESIDENT - APPROVE / REJECT REQUEST
// PATCH: /api/clubs/:clubId/join-requests/:requestId
// ===================================

export const updateJoinRequestStatus = async (
  clubId,
  requestId,
  status
) => {
  if (!["approved", "rejected"].includes(status)) {
    throw new Error("Invalid join request status.");
  }

  return await apiRequest(
    `/api/clubs/${clubId}/join-requests/${requestId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
};


// ===================================
// 5. PRESIDENT - GET CLUB MEMBERS
// GET: /api/clubs/:clubId/members
// ===================================

export const getClubMembers = async (clubId) => {
  return await apiRequest(`/api/clubs/${clubId}/members`);
};


// ===================================
// 6. PRESIDENT - REMOVE CLUB MEMBER
// DELETE: /api/clubs/:clubId/members/:userId
// ===================================

export const removeClubMember = async (clubId, userId) => {
  return await apiRequest(
    `/api/clubs/${clubId}/members/${userId}`,
    {
      method: "DELETE",
    }
  );
};


// ===================================
// 7. USER - CANCEL OWN JOIN REQUEST
// DELETE: /api/clubs/:clubId/join-requests/:requestId
// ===================================

export const cancelClubJoinRequest = async (clubId, requestId) => {
  return await apiRequest(
    `/api/clubs/${clubId}/join-requests/${requestId}`,
    {
      method: "DELETE",
    }
  );
};
