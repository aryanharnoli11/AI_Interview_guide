const crypto = require("crypto")

const users = []
const interviewReports = []
const blacklistedTokens = new Set()

function createId() {
    if (crypto.randomUUID) {
        return crypto.randomUUID()
    }

    return crypto.randomBytes(12).toString("hex")
}

function publicUser(user) {
    return {
        id: user._id,
        username: user.username,
        email: user.email
    }
}

async function findUserByUsernameOrEmail({ username, email }) {
    return users.find((user) => user.username === username || user.email === email) || null
}

async function findUserByEmail(email) {
    return users.find((user) => user.email === email) || null
}

async function findUserById(id) {
    return users.find((user) => user._id === id) || null
}

async function createUser({ username, email, password }) {
    const user = {
        _id: createId(),
        username,
        email,
        password
    }

    users.push(user)

    return user
}

async function addBlacklistedToken(token) {
    blacklistedTokens.add(token)
}

async function isTokenBlacklisted(token) {
    return blacklistedTokens.has(token)
}

async function createInterviewReport(data) {
    const now = new Date()
    const interviewReport = {
        _id: createId(),
        ...data,
        createdAt: now,
        updatedAt: now
    }

    interviewReports.push(interviewReport)

    return interviewReport
}

async function findInterviewReportByIdAndUser(interviewId, userId) {
    return interviewReports.find((report) => report._id === interviewId && report.user === userId) || null
}

async function findInterviewReportsByUser(userId) {
    return interviewReports
        .filter((report) => report.user === userId)
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(({ resume, selfDescription, jobDescription, technicalQuestions, behavioralQuestions, skillGaps, preparationPlan, ...report }) => report)
}

module.exports = {
    publicUser,
    findUserByUsernameOrEmail,
    findUserByEmail,
    findUserById,
    createUser,
    addBlacklistedToken,
    isTokenBlacklisted,
    createInterviewReport,
    findInterviewReportByIdAndUser,
    findInterviewReportsByUser
}
