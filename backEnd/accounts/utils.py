import re


def get_client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


_OS_PATTERNS = [
    (r'Windows', 'Windows'),
    (r'Mac OS X', 'macOS'),
    (r'iPhone|iPad', 'iOS'),
    (r'Android', 'Android'),
    (r'Linux', 'Linux'),
]

_BROWSER_PATTERNS = [
    (r'Edg/', 'Edge'),
    (r'Chrome/', 'Chrome'),
    (r'Firefox/', 'Firefox'),
    (r'Safari/', 'Safari'),
]


def parse_device(request):
    ua = request.META.get('HTTP_USER_AGENT', '')
    os_name = next((name for pattern, name in _OS_PATTERNS if re.search(pattern, ua)), 'Unknown OS')
    browser_name = next((name for pattern, name in _BROWSER_PATTERNS if re.search(pattern, ua)), 'Unknown browser')
    return f'{browser_name} on {os_name}'
