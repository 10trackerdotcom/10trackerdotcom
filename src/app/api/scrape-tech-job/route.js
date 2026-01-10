import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

function generateHTML(jobData, applyUrl) {
    if (!jobData) {
        return '<div>Job data not available</div>';
    }
    
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) {
            return dateString;
        }
    };
    
    const formatSalary = (salary) => {
        if (!salary) return 'Not specified';
        if (salary.value) {
            const val = salary.value;
            if (val.minValue && val.maxValue) {
                return `$${val.minValue} - $${val.maxValue} per ${val.unitText?.toLowerCase() || 'hour'}`;
            }
        }
        return 'Not specified';
    };
    
    const formatList = (text) => {
        if (!text) return '';
        return text.split(',').map(item => item.trim()).filter(item => item);
    };
    
    const formatDescription = (description) => {
        if (!description) return '<p>No description available</p>';
        let desc = description.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        return `<div>${desc}</div>`;
    };
    
    const html = `
<div>
    <div>
        <!-- Header -->
        <div>
            <h1 style="margin: 0 0 8px 0; padding: 0;">${jobData.title || 'Job Title'}</h1>
        </div>
        
        <!-- Main Content -->
        <div>
            <!-- Job Overview -->
            <div>
                <h2 style="margin: 12px 0 6px 0; padding: 0;">Job Overview</h2>
                <p style="margin: 2px 0; padding: 0;"><strong>Company:</strong> ${jobData.hiringOrganization?.name || 'N/A'}</p>
                <p style="margin: 2px 0; padding: 0;"><strong>Employment Type:</strong> ${jobData.employmentType || 'N/A'}</p>
                <p style="margin: 2px 0; padding: 0;"><strong>Location:</strong> ${jobData.jobLocationType === 'TELECOMMUTE' ? 'Remote' : (jobData.jobLocation || 'N/A')}${jobData.applicantLocationRequirements?.length > 0 ? ` (${jobData.applicantLocationRequirements.map(loc => loc.name).join(', ')})` : ''}</p>
                <p style="margin: 2px 0; padding: 0;"><strong>Salary:</strong> ${formatSalary(jobData.baseSalary)}${jobData.baseSalary?.currency ? ` (${jobData.baseSalary.currency})` : ''}</p>
                <p style="margin: 2px 0; padding: 0;"><strong>Date Posted:</strong> ${formatDate(jobData.datePosted)}</p>
                <p style="margin: 2px 0; padding: 0;"><strong>Experience Required:</strong> ${jobData.experienceRequirements ? `${jobData.experienceRequirements} year(s)` : 'Not specified'}</p>
                ${jobData.validThrough ? `<p style="margin: 2px 0; padding: 0;"><strong>Valid Through:</strong> ${formatDate(jobData.validThrough)}</p>` : ''}
            </div>
            
            <!-- Skills -->
            ${jobData.skills ? `
            <h2 style="margin: 12px 0 6px 0; padding: 0;">Required Skills</h2>
            <div style="margin: 0; padding: 0;">
                ${jobData.skills.split(',').map(skill => 
                    `<span>${skill.trim()}</span>`
                ).join(', ')}
            </div>
            ` : ''}
            
            <!-- Qualifications -->
            ${jobData.qualifications ? `
            <h2 style="margin: 12px 0 6px 0; padding: 0;">Qualifications</h2>
            <ul style="margin: 0 0 8px 0; padding-left: 20px;">
                ${jobData.qualifications.split(',').map(qual => 
                    `<li style="margin: 1px 0; padding: 0;">${qual.trim()}</li>`
                ).join('')}
            </ul>
            ` : ''}
            
            <!-- Responsibilities -->
            ${jobData.responsibilities ? `
            <h2 style="margin: 12px 0 6px 0; padding: 0;">Responsibilities</h2>
            <ul style="margin: 0 0 8px 0; padding-left: 20px;">
                ${jobData.responsibilities.split(',').map(resp => 
                    `<li style="margin: 1px 0; padding: 0;">${resp.trim()}</li>`
                ).join('')}
            </ul>
            ` : ''}
            
            <!-- Job Benefits -->
            ${jobData.jobBenefits ? `
            <h2 style="margin: 12px 0 6px 0; padding: 0;">Benefits</h2>
            <ul style="margin: 0 0 8px 0; padding-left: 20px;">
                ${jobData.jobBenefits.split(',').map(benefit => 
                    `<li style="margin: 1px 0; padding: 0;">${benefit.trim()}</li>`
                ).join('')}
            </ul>
            ` : ''}
            
            <!-- Apply Button -->
            ${applyUrl ? `
            <div style="margin: 12px 0 0 0; padding: 8px 0 0 0; border-top: 1px solid #ddd; text-align: center;">
                <a href="${applyUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 10px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 4px;">
                    Apply Now
                </a>
                <p style="margin: 6px 0 0 0; padding: 0; font-size: 14px; color: #666;">
                    You will be redirected to the company's application page
                </p>
            </div>
            ` : ''}
        </div>
    </div>
</div>
    `.trim();
    
    return html;
}

export async function POST(request) {
    try {
        const { url } = await request.json();
        
        if (!url) {
            return NextResponse.json(
                { success: false, error: 'URL is required' },
                { status: 400 }
            );
        }

        // Extract slug from URL (part after /job/)
        const urlMatch = url.match(/\/job\/([^\/\?]+)/);
        const targetSlug = urlMatch ? urlMatch[1] : null;
        
        if (!targetSlug) {
            return NextResponse.json(
                { success: false, error: 'Could not extract slug from URL. URL should be in format: https://www.jobfound.org/job/...' },
                { status: 400 }
            );
        }
        
        // Fetch the webpage
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const html = response.data;
        const $ = cheerio.load(html);
        
        // Get all script tags
        const scriptTags = [];
        $('script').each((index, element) => {
            const scriptContent = $(element).html();
            const scriptType = $(element).attr('type');
            scriptTags.push({
                index: index,
                type: scriptType,
                content: scriptContent
            });
        });
        
        // Extract the last script tag
        const lastScriptTag = scriptTags[scriptTags.length - 1];
        
        // Find script tag with "@type": "JobPosting"
        let jobPostingScript = null;
        for (const script of scriptTags) {
            if (script.content) {
                const contentLower = script.content.toLowerCase();
                if (contentLower.includes('jobposting') || 
                    (contentLower.includes('@type') && contentLower.includes('jobposting'))) {
                    jobPostingScript = script;
                    break;
                }
            }
        }
        
        // Also check script tags with type="application/ld+json"
        if (!jobPostingScript) {
            $('script[type="application/ld+json"]').each((index, element) => {
                const scriptContent = $(element).html();
                if (scriptContent && (scriptContent.includes('JobPosting') || scriptContent.includes('"@type": "JobPosting"'))) {
                    jobPostingScript = {
                        index: index,
                        type: 'application/ld+json',
                        content: scriptContent
                    };
                    return false; // break
                }
            });
        }
        
        // Clean and parse JobPosting script
        let cleanedJobPostingData = null;
        if (jobPostingScript && jobPostingScript.content) {
            try {
                // Extract JSON from Next.js format: self.__next_f.push([1,"{...}"])
                const pushMatch = jobPostingScript.content.match(/self\.__next_f\.push\(\[1,"([\s\S]*)"\]\)/);
                if (pushMatch) {
                    let jsonString = pushMatch[1];
                    // Unescape the JSON string
                    jsonString = jsonString
                        .replace(/\\"/g, '"')
                        .replace(/\\\\/g, '\\')
                        .replace(/\\n/g, '\n')
                        .replace(/\\t/g, '\t')
                        .replace(/\\r/g, '\r')
                        .replace(/\\u0026/g, '&');
                    
                    cleanedJobPostingData = JSON.parse(jsonString);
                } else {
                    // Try direct JSON parse if not in Next.js format
                    cleanedJobPostingData = JSON.parse(jobPostingScript.content);
                }
            } catch (e) {
                // If parsing fails, try to extract just the JSON object
                try {
                    const jsonMatch = jobPostingScript.content.match(/\{[\s\S]*"@type"\s*:\s*"JobPosting"[\s\S]*\}/);
                    if (jsonMatch) {
                        let jsonStr = jsonMatch[0]
                            .replace(/\\"/g, '"')
                            .replace(/\\\\/g, '\\');
                        cleanedJobPostingData = JSON.parse(jsonStr);
                    }
                } catch (e2) {
                    console.error('Error parsing job posting data:', e2);
                }
            }
        }
        
        // Search for the specific slug in the last script tag and extract the "apply" field
        let applyUrl = null;
        
        if (lastScriptTag && lastScriptTag.content) {
            try {
                const content = lastScriptTag.content;
                
                // Extract inner content from Next.js format
                const pushMatch = content.match(/self\.__next_f\.push\(\[1,"([\s\S]*)"\]\)/);
                let searchContent = pushMatch ? pushMatch[1] : content;
                
                // Find the LAST occurrence of the slug (Futura is the last job in the array)
                let slugIndex = searchContent.lastIndexOf(`"slug":"${targetSlug}"`);
                
                if (slugIndex === -1) {
                    slugIndex = searchContent.lastIndexOf(`\\"slug\\":\\"${targetSlug}\\"`);
                }
                
                if (slugIndex !== -1) {
                    // Search forward from slug for "apply" field
                    // Use a larger window and look for apply field that comes after the slug
                    const searchWindow = searchContent.substring(slugIndex, Math.min(slugIndex + 2000, searchContent.length));
                    
                    // Find the first "apply" field after the slug
                    // Pattern: "apply":"url" or \"apply\":\"url\"
                    const applyMatch1 = searchWindow.match(/"apply"\s*:\s*"([^"]+)"/);
                    if (applyMatch1 && applyMatch1[1]) {
                        applyUrl = applyMatch1[1]
                            .replace(/\\"/g, '"')
                            .replace(/\\\\/g, '\\')
                            .replace(/\\u0026/g, '&');
                    } else {
                        // Try escaped pattern
                        const applyMatch2 = searchWindow.match(/\\"apply\\"\s*:\s*\\"([^"]+)\\"/);
                        if (applyMatch2 && applyMatch2[1]) {
                            applyUrl = applyMatch2[1]
                                .replace(/\\"/g, '"')
                                .replace(/\\\\/g, '\\')
                                .replace(/\\u0026/g, '&');
                        } else {
                            // Try with more flexible pattern that handles escaped quotes in URL
                            const applyMatch3 = searchWindow.match(/"apply"\s*:\s*"((?:[^"\\]|\\.)+)"/);
                            if (applyMatch3 && applyMatch3[1]) {
                                applyUrl = applyMatch3[1]
                                    .replace(/\\"/g, '"')
                                    .replace(/\\\\/g, '\\')
                                    .replace(/\\u0026/g, '&');
                            }
                        }
                    }
                }
                
            } catch (error) {
                console.error('Error extracting apply URL:', error.message);
            }
        }
        
        // Random company image URL
        const companyImageUrls = [
            'https://www.jobfound.org/images/Company/CompanyImage14.png',
            'https://www.jobfound.org/images/Company/CompanyImage16.png',
            'https://www.jobfound.org/images/Company/CompanyImage12.png',
            'https://www.jobfound.org/images/Company/CompanyImage3.png',
            'https://www.jobfound.org/images/Company/CompanyImage6.png'
        ];
        const randomCompanyImage = companyImageUrls[Math.floor(Math.random() * companyImageUrls.length)];
        
        // Generate HTML version
        const finalVersion = generateHTML(cleanedJobPostingData, applyUrl).replace(/\n/g, '');
        
        // Extract title from job data or use default
        const title = cleanedJobPostingData?.title || 'Tech Job Posting';
        
        // Extract excerpt/description
        const excerpt = cleanedJobPostingData?.description 
            ? cleanedJobPostingData.description.substring(0, 200) + '...'
            : (title ? title.substring(0, 200) + '...' : '');
        
        return NextResponse.json({
            success: true,
            data: {
                title,
                content: finalVersion,
                excerpt: excerpt || title.substring(0, 200) + '...',
                description: cleanedJobPostingData?.description || null,
                finalVersion,
                jobData: cleanedJobPostingData,
                applyUrl: applyUrl,
                companyImage: randomCompanyImage
            }
        });
        
    } catch (error) {
        console.error('Error scraping tech job:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error.message || 'Failed to scrape tech job'
            },
            { status: 500 }
        );
    }
}

