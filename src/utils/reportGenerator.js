/**
 * Combinatorial AI Template Library
 * Updated to support exactly 11 professional roles.
 */

export const professionalEngines = {
    SALES: {
        actions: [
            'Met with the client regarding [TASK]',
            'Followed up on the progress of [TASK]',
            'Coordinated with the team to advance [TASK]',
            'Handled the requirements for [TASK]',
            'Organized a discussion focused on [TASK]',
            'Worked on closing the details for [TASK]',
            'Contacted potential leads for [TASK]',
            'Updated the sales pipeline regarding [TASK]',
            'Drafted a proposal related to [TASK]',
            'Negotiated the terms for [TASK]'
        ],
        impacts: [
            'to ensure customer satisfaction.',
            'resulting in a clear path forward.',
            'to help meet our monthly targets.',
            'to strengthen our client relationship.',
            'and identified next steps for growth.',
            'to finalize the current agreement.',
            'ensuring all client needs are addressed.',
            'which improved our conversion chances.',
            'to maintain a healthy sales funnel.',
            'resulting in a positive outcome.'
        ]
    },
    SERVICE: {
        actions: [
            'Completed a service visit for [TASK]',
            'Performed a technical check on [TASK]',
            'Fixed the issues related to [TASK]',
            'Handled a customer request for [TASK]',
            'Provided on-site support for [TASK]',
            'Resolved the problem regarding [TASK]',
            'Maintained and updated [TASK]',
            'Inspected the setup for [TASK]',
            'Tested the functionality of [TASK]',
            'Followed up on a service call for [TASK]'
        ],
        impacts: [
            'to ensure smooth operations.',
            'resulting in zero downtime.',
            'to meet the service level agreement.',
            'ensuring the customer is happy.',
            'to prevent future technical errors.',
            'resulting in improved system performance.',
            'to maintain high quality standards.',
            'and confirmed everything is working well.',
            'to guarantee reliable service.',
            'providing a permanent solution.'
        ]
    },
    MARKETING: {
        actions: [
            'Created a design for [TASK]',
            'Managed the social media for [TASK]',
            'Updated the website content for [TASK]',
            'Planned a campaign for [TASK]',
            'Ran an SEO check on [TASK]',
            'Drafted a newsletter about [TASK]',
            'Analyzed the data from [TASK]',
            'Researched new ideas for [TASK]',
            'Handled the branding for [TASK]',
            'Coordinated a launch for [TASK]'
        ],
        impacts: [
            'to increase our brand reach.',
            'resulting in more user engagement.',
            'to attract new customers.',
            'ensuring our message is clear.',
            'to improve our online visibility.',
            'resulting in better search rankings.',
            'to keep the community updated.',
            'and identified market trends.',
            'to maintain a professional image.',
            'to drive more traffic to our site.'
        ]
    },
    DEVELOPMENT: {
        actions: [
            'Wrote the code for [TASK]',
            'Fixed a bug in [TASK]',
            'Developed a new feature for [TASK]',
            'Updated the system for [TASK]',
            'Handled the database for [TASK]',
            'Tested the performance of [TASK]',
            'Optimized the backend for [TASK]',
            'Reviewed the code related to [TASK]',
            'Integrated a tool for [TASK]',
            'Deployed an update for [TASK]'
        ],
        impacts: [
            'to ensure the app runs smoothly.',
            'resulting in a better user experience.',
            'to improve overall site speed.',
            'ensuring data security and safety.',
            'to make the platform more stable.',
            'resulting in fewer errors.',
            'to handle more users easily.',
            'and confirmed the features work.',
            'to streamline our tech stack.',
            'providing a modern solution.'
        ]
    },
    REPAIR: {
        actions: [
            'Repaired the hardware for [TASK]',
            'Replaced a part in [TASK]',
            'Cleaned and serviced [TASK]',
            'Fixed a mechanical error in [TASK]',
            'Calibrated the settings for [TASK]',
            'Restored the function of [TASK]',
            'Checked for errors in [TASK]',
            'Handled the maintenance for [TASK]',
            'Updated the components for [TASK]',
            'Troubleshot the issue with [TASK]'
        ],
        impacts: [
            'to get it back to working condition.',
            'preventing any further damage.',
            'to prolong the life of the machine.',
            'ensuring safe and easy usage.',
            'to meet company safety standards.',
            'resulting in perfect performance.',
            'to avoid future breakdown.',
            'providing a reliable fix.',
            'to ensure precise results.',
            'and confirmed it is now stable.'
        ]
    },
    HR: {
        actions: [
            'Conducted an interview for [TASK]',
            'Handled the hiring process for [TASK]',
            'Updated the staff records for [TASK]',
            'Managed employee relations for [TASK]',
            'Organized a training for [TASK]',
            'Drafted a policy for [TASK]',
            'Reviewed the payroll for [TASK]',
            'Coordinated with the team on [TASK]',
            'Handled the onboarding for [TASK]',
            'Planned a staff meeting for [TASK]'
        ],
        impacts: [
            'to build a stronger team.',
            'ensuring a positive work culture.',
            'to stay compliant with rules.',
            'resulting in better team spirit.',
            'to help employees grow.',
            'ensuring everyone is on the same page.',
            'to improve office productivity.',
            'and addressed important concerns.',
            'to maintain organized records.',
            'resulting in a smooth workflow.'
        ]
    },
    ADMIN: {
        actions: [
            'Filed the documents for [TASK]',
            'Managed the office for [TASK]',
            'Updated the schedules for [TASK]',
            'Handled the paperwork for [TASK]',
            'Ordered the supplies for [TASK]',
            'Coordinated a meeting for [TASK]',
            'Drafted an email about [TASK]',
            'Organized the files for [TASK]',
            'Researched information on [TASK]',
            'Supported the team with [TASK]'
        ],
        impacts: [
            'to keep the office running well.',
            'ensuring everything is organized.',
            'to avoid any scheduling conflicts.',
            'resulting in faster operations.',
            'to maintain a professional workspace.',
            'ensuring clear communication.',
            'to keep the records accurate.',
            'and helped save time for others.',
            'to reduce administrative burden.',
            'resulting in a clean workflow.'
        ]
    },
    FINANCE: {
        actions: [
            'Processed an invoice for [TASK]',
            'Updated the accounts for [TASK]',
            'Reconciled the data for [TASK]',
            'Managed the budget for [TASK]',
            'Handled a payment for [TASK]',
            'Calculated the costs for [TASK]',
            'Audited the records for [TASK]',
            'Drafted a financial report on [TASK]',
            'Reviewed the expenses for [TASK]',
            'Verified the bills for [TASK]'
        ],
        impacts: [
            'to ensure financial accuracy.',
            'maintaining a clear balance sheet.',
            'to track our company spending.',
            'resulting in better cost control.',
            'ensuring all bills are paid on time.',
            'to prevent any data errors.',
            'resulting in transparent reporting.',
            'to help with future planning.',
            'ensuring we stay within budget.',
            'to maintain fiscal health.'
        ]
    },
    LEGAL: {
        actions: [
            'Drafted an agreement for [TASK]',
            'Reviewed the contract for [TASK]',
            'Handled legal compliance for [TASK]',
            'Researched the laws for [TASK]',
            'Updated the legal docs for [TASK]',
            'Consulted with the team on [TASK]',
            'Checked the terms for [TASK]',
            'Managed a legal query for [TASK]',
            'Verified the permits for [TASK]',
            'Prepared a document for [TASK]'
        ],
        impacts: [
            'to protect the company interests.',
            'ensuring full legal safety.',
            'to avoid any future disputes.',
            'resulting in a secure agreement.',
            'to stay updated with new rules.',
            'ensuring all terms are fair.',
            'to minimize potential risks.',
            'resulting in a solid contract.',
            'to follow all government laws.',
            'to maintain legal integrity.'
        ]
    },
    TRAINER: {
        actions: [
            'Led a session on [TASK]',
            'Taught the team about [TASK]',
            'Created a guide for [TASK]',
            'Handled a workshop on [TASK]',
            'Provided feedback for [TASK]',
            'Demonstrated the process for [TASK]',
            'Explained the steps for [TASK]',
            'Answered questions about [TASK]',
            'Checked the progress of [TASK]',
            'Mentored the staff on [TASK]'
        ],
        impacts: [
            'to increase our team skills.',
            'resulting in better performance.',
            'to make the work easier for everyone.',
            'ensuring a clear understanding.',
            'to help staff work independently.',
            'resulting in fewer mistakes.',
            'to build more expertise.',
            'and confirmed everyone learned it.',
            'to keep the team motivated.',
            'resulting in a more capable team.'
        ]
    },
    MANAGER: {
        actions: [
            'Approved the plan for [TASK]',
            'Reviewed the reports for [TASK]',
            'Led the team meeting about [TASK]',
            'Supervised the work on [TASK]',
            'Planned the schedule for [TASK]',
            'Checked the quality of [TASK]',
            'Handled the strategy for [TASK]',
            'Coordinated the resources for [TASK]',
            'Monitored the status of [TASK]',
            'Directed the effort on [TASK]'
        ],
        impacts: [
            'to ensure project success.',
            'resulting in hit targets.',
            'to keep the team on track.',
            'ensuring we meet our deadlines.',
            'to optimize team performance.',
            'resulting in high quality work.',
            'to align with company goals.',
            'ensuring all tasks are completed.',
            'to identify and solve bottlenecks.',
            'resulting in a smooth operation.'
        ]
    }
};

const keywordMap = {
    'lead': 'SALES', 'prospect': 'SALES', 'pipeline': 'SALES', 'closing': 'SALES',
    'visit': 'SERVICE', 'maintenance': 'SERVICE', 'repair': 'REPAIR', 'diagnostic': 'REPAIR',
    'campaign': 'MARKETING', 'seo': 'MARKETING', 'social': 'MARKETING',
    'bug': 'DEVELOPMENT', 'fixed': 'DEVELOPMENT', 'dev': 'DEVELOPMENT', 'api': 'DEVELOPMENT',
    'hiring': 'HR', 'interview': 'HR', 'payroll': 'FINANCE', 'hr': 'HR',
    'budget': 'FINANCE', 'audit': 'FINANCE', 'invoice': 'FINANCE',
    'legal': 'LEGAL', 'contract': 'LEGAL', 'compliance': 'LEGAL',
    'training': 'TRAINER', 'workshop': 'TRAINER', 'coaching': 'TRAINER',
    'strategy': 'MANAGER', 'team': 'MANAGER', 'management': 'MANAGER',
    'admin': 'ADMIN', 'filing': 'ADMIN', 'documentation': 'ADMIN'
};

const prefixes = [
    'Directly', 'Specifically', 'Consistently', 'Personally', 'Properly',
    'Carefully', 'Successfully', 'Actively', 'Systematically', 'Efficiency-wise,'
];

const engineMapping = {
    'Sales Professional': 'SALES',
    'Service/Support': 'SERVICE',
    'Marketing/Branding': 'MARKETING',
    'Development/Tech': 'DEVELOPMENT',
    'Repair/Technical': 'REPAIR',
    'Human Resources': 'HR',
    'Admin/Coordination': 'ADMIN',
    'Finance/Accounts': 'FINANCE',
    'Legal/Compliance': 'LEGAL',
    'Trainer/Coach': 'TRAINER',
    'Manager/Lead': 'MANAGER'
};

export const generateExpandedReport = (input, designation = 'General', tone = 'Standard', useAI = true) => {
    if (!input) return [];

    let rawLines = [];
    if (Array.isArray(input)) {
        // Handle structured array input
        rawLines = input.map(item => ({
            text: item.text,
            startTime: item.startTime,
            endTime: item.endTime,
            time: item.time
        }));
    } else if (typeof input === 'string') {
        // Handle raw string input (Bulk Import)
        rawLines = input.split(/\n|•|[-*]\s/)
            .filter(line => line.trim().length > 0)
            .map(line => ({ text: line, time: null }));
    }

    if (rawLines.length === 0) return [];

    const usedActions = new Set();
    const usedImpacts = new Set();
    const usedPrefixes = new Set();

    return rawLines.map((item, index) => {
        let trimmedLine = item.text.trim();
        let category = 'General';
        let lowerLine = trimmedLine.toLowerCase();

        // 1. Determine Timestamp (Range)
        let timestamp = '';
        if (item.startTime && item.endTime) {
            const formatTime = (t) => {
                const [h, m] = t.split(':');
                const d = new Date();
                d.setHours(parseInt(h), parseInt(m));
                return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            };
            timestamp = `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`;
        } else if (item.time) {
            // Legacy/Single time support
            const [hours, minutes] = item.time.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes));
            timestamp = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } else {
            timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        }

        lowerLine = trimmedLine.toLowerCase();

        // 2. Identify category via keywords
        for (const [key, cat] of Object.entries(keywordMap)) {
            if (lowerLine.includes(key)) {
                category = cat;
                break;
            }
        }

        // 3. Use Designation if keyword mapping failed
        if (category === 'General' && designation !== 'General') {
            category = engineMapping[designation] || designation.toUpperCase();
        }

        // 4. Detect Action Items
        const actionKeywords = ['need to', 'must', 'follow up', 'required', 'pending', 'todo', 'to-do'];
        const isActionItem = actionKeywords.some(key => lowerLine.includes(key));

        // Use raw text if AI is disabled
        if (!useAI) {
            return {
                id: Math.random().toString(36).substr(2, 9),
                original: trimmedLine,
                expanded: trimmedLine,
                category: category.replace('_', ' '),
                isActionItem: isActionItem,
                timestamp: timestamp
            };
        }

        // 5. Select Engine
        let engineKey = category.toUpperCase();
        if (engineKey === 'TECH') engineKey = 'DEVELOPMENT';
        const engine = professionalEngines[engineKey] || professionalEngines.DEVELOPMENT;

        // 6. Select Unique Action
        let actionIdx;
        let attempts = 0;
        do {
            actionIdx = Math.floor(Math.random() * engine.actions.length);
            attempts++;
        } while (usedActions.has(`${engineKey}_${actionIdx}`) && attempts < 10);
        usedActions.add(`${engineKey}_${actionIdx}`);
        let action = engine.actions[actionIdx];

        // 7. Select Unique Impact
        attempts = 0;
        let impactIdx;
        do {
            impactIdx = Math.floor(Math.random() * engine.impacts.length);
            attempts++;
        } while (usedImpacts.has(`${engineKey}_${impactIdx}`) && attempts < 10);
        usedImpacts.add(`${engineKey}_${impactIdx}`);
        let impact = engine.impacts[impactIdx];

        // 8. Tone Refinement
        if (tone === 'Executive') {
            action = action.replace('Worked on', 'Orchestrated')
                .replace('Met with', 'Engaged stakeholders for')
                .replace('Handled', 'Strategized')
                .replace('Updated', 'Optimized pipeline for');
            impact = impact.replace('to ensure', 'to maximize')
                .replace('resulting in', 'driving')
                .replace('to help', 'to accelerate');
        } else if (tone === 'Technical') {
            action = action.replace('Worked on', 'Implemented logic for')
                .replace('Met with', 'Consulted technical specs for')
                .replace('Processed', 'Executed backend processing for')
                .replace('Checked', 'Validated parameters for');
            impact = impact.replace('clear path', 'robust architecture')
                .replace('everything is working', 'system state is verified');
        } else if (tone === 'Direct') {
            impact = '';
            action = action.split('regarding')[0].split('focused on')[0].split('related to')[0];
        }

        // 9. Select Unique Prefix
        let prefix = '';
        if (index % 2 === 0 && tone !== 'Direct') {
            attempts = 0;
            let prefixIdx;
            do {
                prefixIdx = Math.floor(Math.random() * prefixes.length);
                attempts++;
            } while (usedPrefixes.has(prefixIdx) && attempts < 5);
            usedPrefixes.add(prefixIdx);
            prefix = prefixes[prefixIdx] + ' ';
        }

        // 10. Generate Professional Text
        let professionalText = `${prefix}${action.replace('[TASK]', trimmedLine)} ${impact}`.trim();
        if (trimmedLine.length < 3) professionalText = trimmedLine;

        return {
            id: Math.random().toString(36).substr(2, 9),
            original: trimmedLine,
            expanded: professionalText,
            category: category.replace('_', ' '),
            isActionItem: isActionItem,
            timestamp: timestamp
        };
    });
};
