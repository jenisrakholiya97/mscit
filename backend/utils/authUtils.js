const getOwnerId = (user) => {
    if (!user) return null;
    const role = (user.role || '').toLowerCase();
    if (role === 'owner' || role === 'admin') {
        return user.id;
    }
    return user.owner_id || user.id;
};

module.exports = { getOwnerId };
