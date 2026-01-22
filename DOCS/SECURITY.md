# Security Documentation

This document outlines the security measures implemented in the BOOKMATE backend system.

## Security Features

### 1. Authentication & Authorization

- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds (10)
- **Role-Based Access Control**: Admin and Student roles
- **Token Expiration**: Configurable expiration (default: 7 days)

### 2. Rate Limiting

Rate limiting is implemented to prevent abuse and DDoS attacks:

- **General API**: 100 requests per 15 minutes (production), 1000 (development)
- **Authentication Endpoints**: 5 requests per 15 minutes
- **Payment Endpoints**: 10 requests per 15 minutes
- **File Upload Endpoints**: 20 uploads per hour

Rate limiters track requests by IP address and return HTTP 429 (Too Many Requests) when limits are exceeded.

### 3. Security Headers

The following security headers are automatically set:

- **X-Content-Type-Options**: `nosniff` - Prevents MIME type sniffing
- **X-Frame-Options**: `DENY` - Prevents clickjacking
- **X-XSS-Protection**: `1; mode=block` - XSS protection
- **Strict-Transport-Security**: HSTS header (production only)
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Permissions-Policy**: Restricts browser features

### 4. Helmet.js Configuration

Helmet.js provides additional security headers:

- **Content Security Policy (CSP)**: Restricts resource loading
- **Cross-Origin Embedder Policy**: Prevents cross-origin embedding
- **Cross-Origin Resource Policy**: Controls cross-origin resource access

### 5. Input Validation & Sanitization

- **Zod Schema Validation**: All inputs validated against schemas
- **Input Sanitization**: Removes potentially dangerous content:
  - Script tags
  - JavaScript: URLs
  - Event handlers (onclick, onerror, etc.)
- **SQL Injection Protection**: TypeORM uses parameterized queries
- **XSS Protection**: Input sanitization prevents stored XSS attacks

### 6. CORS Configuration

- Configurable allowed origins
- Credentials support
- Specific HTTP methods allowed
- Custom headers support

### 7. Request Size Limits

- **JSON Body**: 10MB limit
- **URL Encoded**: 10MB limit
- **File Uploads**: 100MB limit (configured in multer)

### 8. Error Handling

- **No Stack Traces in Production**: Prevents information leakage
- **Generic Error Messages**: Avoids exposing system internals
- **Structured Error Responses**: Consistent error format

### 9. Database Security

- **Parameterized Queries**: TypeORM prevents SQL injection
- **Connection Pooling**: Efficient and secure database connections
- **SSL/TLS**: Database connections use SSL in production

### 10. Environment Variables

- **Sensitive Data**: Never hardcoded, always in environment variables
- **.env File**: Excluded from version control
- **Default Values**: Safe defaults for development

## Security Best Practices

### For Developers

1. **Never commit secrets**: Use `.env` file and `.gitignore`
2. **Keep dependencies updated**: Regularly run `npm audit`
3. **Use HTTPS in production**: Always use SSL/TLS
4. **Validate all inputs**: Use Zod schemas for validation
5. **Sanitize user inputs**: Always sanitize before storing
6. **Use parameterized queries**: Never concatenate SQL queries
7. **Implement proper logging**: Log security events
8. **Regular security audits**: Review code for vulnerabilities

### For Deployment

1. **Use strong JWT secrets**: Generate cryptographically secure secrets
2. **Enable HTTPS**: Use reverse proxy (nginx, Cloudflare) with SSL
3. **Configure firewall**: Restrict access to necessary ports only
4. **Monitor logs**: Set up log monitoring and alerting
5. **Regular backups**: Backup database regularly
6. **Update dependencies**: Keep all packages updated
7. **Use Docker**: Containerization adds security layer
8. **Monitor rate limits**: Adjust based on traffic patterns

### For API Consumers

1. **Use HTTPS**: Always use encrypted connections
2. **Store tokens securely**: Never expose JWT tokens
3. **Handle errors gracefully**: Don't expose tokens in error messages
4. **Respect rate limits**: Implement retry logic with exponential backoff
5. **Validate responses**: Always validate API responses

## Security Checklist

### Pre-Deployment

- [ ] All environment variables set correctly
- [ ] JWT secret is strong and unique
- [ ] Database credentials are secure
- [ ] CORS origins are properly configured
- [ ] Rate limits are appropriate for expected traffic
- [ ] HTTPS is enabled
- [ ] Security headers are tested
- [ ] Dependencies are up to date (`npm audit`)
- [ ] No sensitive data in code or logs
- [ ] Error messages don't leak information

### Post-Deployment

- [ ] Monitor error logs for suspicious activity
- [ ] Monitor rate limit violations
- [ ] Review access logs regularly
- [ ] Keep dependencies updated
- [ ] Regular security audits
- [ ] Backup database regularly
- [ ] Test disaster recovery procedures

## Incident Response

If a security incident occurs:

1. **Immediately revoke compromised tokens**: Invalidate JWT secrets
2. **Review logs**: Identify the scope of the breach
3. **Notify affected users**: If user data is compromised
4. **Patch vulnerabilities**: Fix the security issue
5. **Update security measures**: Prevent similar incidents
6. **Document the incident**: For future reference

## Security Monitoring

### Recommended Tools

- **Log Monitoring**: Set up centralized logging (e.g., ELK stack, Datadog)
- **Intrusion Detection**: Monitor for suspicious patterns
- **Vulnerability Scanning**: Regular automated scans
- **Dependency Scanning**: Automated dependency vulnerability checks
- **Rate Limit Monitoring**: Track rate limit violations

### Key Metrics to Monitor

- Failed authentication attempts
- Rate limit violations
- Unusual request patterns
- Error rates
- Response times
- Database query performance

## Compliance

This system implements security measures aligned with:

- **OWASP Top 10**: Protection against common vulnerabilities
- **CWE Top 25**: Prevention of common weaknesses
- **PCI DSS**: Payment data security (via OPay gateway)

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT create a public issue**: Security issues should be reported privately
2. **Contact the maintainers**: Report via secure channel
3. **Provide details**: Include steps to reproduce
4. **Allow time for fix**: Give maintainers time to address the issue

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [TypeORM Security](https://typeorm.io/#/security)

