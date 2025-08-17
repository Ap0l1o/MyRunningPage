import os
import requests
import webbrowser
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# Strava API配置
REDIRECT_URI = "http://localhost:8000/callback"
AUTH_URL = "https://www.strava.com/oauth/authorize"
TOKEN_URL = "https://www.strava.com/oauth/token"

class TokenHandler(BaseHTTPRequestHandler):
    # 使用类变量而不是实例变量
    client_id = None
    client_secret = None
    def do_GET(self):
        if self.path.startswith('/callback'):
            # 获取授权码
            query_components = parse_qs(urlparse(self.path).query)
            code = query_components.get('code', [None])[0]
            
            if code:
                print("收到授权码: ", code)
                print("client_id: ", TokenHandler.client_id)
                print("client_secret: ", TokenHandler.client_secret)
                # 使用授权码获取访问令牌
                response = requests.post(TOKEN_URL, data={
                    'client_id': TokenHandler.client_id,
                    'client_secret': TokenHandler.client_secret,
                    'code': code,
                    'grant_type': 'authorization_code'
                })

                if response.status_code == 200:
                    token_data = response.json()
                    refresh_token = token_data['refresh_token']
                    access_token = token_data['access_token']
                    
                    print("已获取refresh_token: ", refresh_token)
                    print("已获取access_token: ", access_token)
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'text/html; charset=utf-8')
                    self.end_headers()
                    html_content = '''
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Strava授权成功</title>
                    </head>
                    <body>
                        <h1>授权成功！</h1>
                        <p>已获取refresh_token，你可以关闭这个窗口了。</p>
                    </body>
                    </html>
                    '''
                    self.wfile.write(html_content.encode('utf-8'))
                else:
                    print("获取访问令牌失败响应: ", response.content)
                    self.send_response(400)
                    self.send_header('Content-type', 'text/html; charset=utf-8')
                    self.end_headers()
                    html_content = '''
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Strava授权失败</title>
                    </head>
                    <body>
                        <h1>授权失败！</h1>
                        <p>获取访问令牌失败！</p>
                    </body>
                    </html>
                    '''
                    self.wfile.write(html_content.encode('utf-8'))
            else:
                self.send_response(400)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.end_headers()
                html_content = '''
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Strava授权失败</title>
                </head>
                <body>
                    <h1>授权失败！</h1>
                    <p>未收到授权码！</p>
                </body>
                </html>
                '''
                self.wfile.write(html_content.encode('utf-8'))

def main(client_id, client_secret):
    # 构建授权URL
    auth_params = {
        'client_id': client_id,
        'response_type': 'code',
        'redirect_uri': REDIRECT_URI,
        'scope': 'activity:read_all'
    }
    auth_url = f"{AUTH_URL}?" + "&".join(f"{k}={v}" for k, v in auth_params.items())
    
    # 打开浏览器进行授权
    print("正在打开浏览器进行Strava授权...")
    webbrowser.open(auth_url)
    
    # 设置TokenHandler的类变量
    TokenHandler.client_id = client_id
    TokenHandler.client_secret = client_secret
    
    # 启动本地服务器接收回调
    server = HTTPServer(('localhost', 8000), TokenHandler)
    print("等待授权回调...")
    server.handle_request()

if __name__ == '__main__':
    # 解析命令行参数
    parser = argparse.ArgumentParser(description='获取Strava API的访问令牌')
    parser.add_argument('--client_id', required=True, help='Strava API的Client ID')
    parser.add_argument('--client_secret', required=True, help='Strava API的Client Secret')
    args = parser.parse_args()
    
    main(args.client_id, args.client_secret)