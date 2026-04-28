const { STSClient, GetCallerIdentityCommand, AssumeRoleCommand } = require("@aws-sdk/client-sts");
const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");
const { CloudFrontClient, ListDistributionsCommand } = require("@aws-sdk/client-cloudfront");
const { KMSClient, ListKeysCommand } = require("@aws-sdk/client-kms");
const { CloudTrailClient, DescribeTrailsCommand } = require("@aws-sdk/client-cloudtrail");

/**
 * Preflight Validation Service
 * Catches permission and configuration errors early.
 */
class PreflightService {
    /**
     * Core validation orchestrator
     */
    static async validateAWS(region, conn, services = []) {
        const results = {
            valid: true,
            checks: []
        };

        try {
            const baseCredentials = conn.access_key ? {
                accessKeyId: conn.access_key,
                secretAccessKey: conn.secret_key
            } : null;

            // Check 1: Base STS Connectivity
            const sts = new STSClient({ region, credentials: baseCredentials });
            await sts.send(new GetCallerIdentityCommand({}));
            results.checks.push({ name: "STS Connectivity", status: "PASS" });

            let activeCredentials = baseCredentials;

            // Check 2: Role Assumption (If configured)
            if (conn.role_arn) {
                try {
                    const assumeCmd = new AssumeRoleCommand({
                        RoleArn: conn.role_arn,
                        RoleSessionName: "CloudiversePreflight",
                        ExternalId: conn.external_id
                    });
                    const assumed = await sts.send(assumeCmd);
                    results.checks.push({ name: "Role Assumption", status: "PASS" });

                    // Use temporary credentials for downstream checks
                    activeCredentials = {
                        accessKeyId: assumed.Credentials.AccessKeyId,
                        secretAccessKey: assumed.Credentials.SecretAccessKey,
                        sessionToken: assumed.Credentials.SessionToken
                    };
                } catch (err) {
                    results.valid = false;
                    results.checks.push({ name: "Role Permissions", status: "FAIL", error: err.message });
                    return results;
                }
            } else if (!conn.access_key) {
                results.valid = false;
                results.checks.push({ name: "Config", status: "FAIL", error: "No Role ARN or Access Keys provided" });
                return results;
            }

            // Downstream Capability Checks
            try {
                // Check 3: S3 Capability (Essential for State and Storage)
                const s3 = new S3Client({ region, credentials: activeCredentials });
                await s3.send(new ListBucketsCommand({}));
                results.checks.push({ name: "S3 Permissions", status: "PASS" });

                // Check 4: KMS Capability (Landing Zone Encryption)
                const kms = new KMSClient({ region, credentials: activeCredentials });
                await kms.send(new ListKeysCommand({ Limit: 1 }));
                results.checks.push({ name: "KMS Access", status: "PASS" });

                // Check 5: CloudTrail Capability (Landing Zone Auditing)
                const trail = new CloudTrailClient({ region, credentials: activeCredentials });
                await trail.send(new DescribeTrailsCommand({ trailNameList: [] }));
                results.checks.push({ name: "CloudTrail Access", status: "PASS" });

                // Check 6: CloudFront Capability (If applicable)
                if (services.includes('cdn') || services.includes('cloudfront')) {
                    const cf = new CloudFrontClient({ region: "us-east-1", credentials: activeCredentials });
                    await cf.send(new ListDistributionsCommand({ MaxItems: 1 }));
                    results.checks.push({ name: "CloudFront Availability", status: "PASS" });
                }
            } catch (capErr) {
                // We don't necessarily fail the WHOLE preflight if a secondary service check fails, 
                // but we mark it as invalid if S3 fails (required).
                const isS3Fail = capErr.name === 'AccessDenied' && results.checks.find(c => c.name === "S3 Permissions" && c.status !== "PASS");
                if (isS3Fail) results.valid = false;
                
                results.checks.push({ name: "Capability Check", status: "WARN", error: capErr.message });
            }

        } catch (err) {
            results.valid = false;
            results.checks.push({ name: "Preflight", status: "ERROR", error: err.message });
        }

        return results;
    }
}

module.exports = PreflightService;
