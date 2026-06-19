const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

function getAiClient() {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY

    if (!apiKey || apiKey === "placeholder-key-for-local-startup") {
        return null
    }

    return new GoogleGenAI({ apiKey })
}

function getFallbackTitle(jobDescription) {
    const firstLine = (jobDescription || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean)

    if (!firstLine) {
        return "Target Role"
    }

    return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine
}

function createFallbackInterviewReport({ resume, selfDescription, jobDescription }) {
    const profileText = [ resume, selfDescription ].filter(Boolean).join(" ")
    const hasProfile = profileText.trim().length > 0

    return {
        title: getFallbackTitle(jobDescription),
        matchScore: hasProfile ? 68 : 45,
        technicalQuestions: [
            {
                question: "Which skills from your profile are strongest for this role?",
                intention: "Checks whether you can connect your experience to the job requirements.",
                answer: "Pick two or three relevant skills, describe where you used them, and connect each example to a requirement from the job description."
            },
            {
                question: "Describe a project where you solved a difficult technical problem.",
                intention: "Assesses problem solving, ownership, and depth of technical understanding.",
                answer: "Use a clear situation, task, action, result structure. Explain the constraint, the tradeoff you chose, and the measurable result."
            }
        ],
        behavioralQuestions: [
            {
                question: "Tell me about a time you learned something quickly for a project.",
                intention: "Evaluates adaptability and learning speed.",
                answer: "Name the skill, why it mattered, how you learned it, and how the project benefited."
            },
            {
                question: "How do you handle feedback during a high-pressure deadline?",
                intention: "Looks for collaboration, maturity, and prioritization.",
                answer: "Show that you listen first, separate urgent changes from later improvements, and communicate tradeoffs clearly."
            }
        ],
        skillGaps: [
            {
                skill: "Role-specific examples",
                severity: "medium"
            },
            {
                skill: "Interview storytelling",
                severity: "low"
            }
        ],
        preparationPlan: [
            {
                day: 1,
                focus: "Map your profile to the job",
                tasks: [
                    "Highlight the top five requirements in the job description.",
                    "Prepare one example from your resume for each major requirement."
                ]
            },
            {
                day: 2,
                focus: "Practice technical answers",
                tasks: [
                    "Review fundamentals related to the role.",
                    "Practice explaining one past project from architecture to result."
                ]
            },
            {
                day: 3,
                focus: "Mock interview",
                tasks: [
                    "Practice behavioral answers out loud.",
                    "Refine answers that sound vague or too long."
                ]
            }
        ]
    }
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const ai = getAiClient()

    if (!ai) {
        return createFallbackInterviewReport({ resume, selfDescription, jobDescription })
    }


    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    return JSON.parse(response.text)


}



async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const ai = getAiClient()

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    if (!ai) {
        const html = `
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.5; padding: 24px;">
                    <h1>Tailored Resume Draft</h1>
                    <h2>Target Role</h2>
                    <p>${jobDescription || "No job description provided."}</p>
                    <h2>Candidate Profile</h2>
                    <p>${selfDescription || resume || "No profile details provided."}</p>
                </body>
            </html>
        `

        return generatePdfFromHtml(html)
    }

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })


    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf }
