import os
import requests
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# Strava API配置
CLIENT_ID = "64343"
CLIENT_SECRET = "0fe08cf959d2840c1a4c1cbc70559c3c386b7fbf"
REDIRECT_URI = "http://localhost:8000/callback"
AUTH_URL = "https://www.strava.com/oauth/authorize"
TOKEN_URL = "https://www.strava.com/oauth/token"

class TokenHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/callback'):
            # 获取授权码
            query_components = parse_qs(urlparse(self.path).query)
            code = query_components.get('code', [None])[0]
            
            if code:
                print("收到授权码: ", code)
                # 使用授权码获取访问令牌
                response = requests.post(TOKEN_URL, data={
                    'client_id': CLIENT_ID,
                    'client_secret': CLIENT_SECRET,
                    'code': code,
                    'grant_type': 'authorization_code'
                })
                
                if response.status_code == 200:
                    token_data = response.json()
                    refresh_token = token_data['refresh_token']
                    access_token = token_data['access_token']
                    
                    # 将refresh_token和access_token保存到环境变量
                    os.environ['STRAVA_REFRESH_TOKEN'] = refresh_token
                    os.environ['STRAVA_ACCESS_TOKEN'] = access_token
                    print("已获取refresh_token: ", refresh_token)
                    print("已获取access_token: ", access_token)
                    
                    # 将token保存到文件
                    with open('../.env', 'w') as f:
                        f.write(f'STRAVA_REFRESH_TOKEN={refresh_token}\n')
                        f.write(f'STRAVA_ACCESS_TOKEN={access_token}')
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()
                    self.wfile.write('授权成功！已获取refresh_token，你可以关闭这个窗口了。'.encode('utf-8'))
                else:
                    self.send_response(400)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()
                    self.wfile.write('获取访问令牌失败！'.encode('utf-8'))
            else:
                self.send_response(400)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write('未收到授权码！'.encode('utf-8'))

def main():
    # 构建授权URL
    auth_params = {
        'client_id': CLIENT_ID,
        'response_type': 'code',
        'redirect_uri': REDIRECT_URI,
        'scope': 'activity:read_all'
    }
    auth_url = f"{AUTH_URL}?" + "&".join(f"{k}={v}" for k, v in auth_params.items())
    
    # 打开浏览器进行授权
    print("正在打开浏览器进行Strava授权...")
    webbrowser.open(auth_url)
    
    # 启动本地服务器接收回调
    server = HTTPServer(('localhost', 8000), TokenHandler)
    print("等待授权回调...")
    server.handle_request()

if __name__ == '__main__':
    main()
    print("\n授权完成！已获取refresh_token，现在可以使用fetch_strava_data.py来获取数据了。")