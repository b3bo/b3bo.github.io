#!/usr/bin/env python3
"""
Convert proxy list from MD file to CSV format for PROXY_LIST env var.
"""

def convert_proxy_list(md_file_path):
    """Convert proxy list to http:// format and join with commas."""
    proxies = []
    with open(md_file_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                parts = line.split(':')
                if len(parts) == 4:
                    ip, port, user, password = parts
                    proxy_url = f"http://{user}:{password}@{ip}:{port}"
                    proxies.append(proxy_url)
    
    return ','.join(proxies)

if __name__ == '__main__':
    md_file = 'ProxyList.md'
    csv_list = convert_proxy_list(md_file)
    print("CSV List:")
    print(csv_list)
    
    # Append to MD file
    with open(md_file, 'a') as f:
        f.write('\n\n## CSV List for PROXY_LIST\n\n')
        f.write(csv_list)
        f.write('\n')
    
    print(f"\nAppended to {md_file}")