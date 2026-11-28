#!/usr/bin/env python3
"""Encode an authorised source clip to a self-contained three-quality VOD package.
Usage: python scripts/media/encode-hls.py INPUT OUTPUT_DIRECTORY
Requires FFmpeg and ffprobe on the local media-processing machine, not the Site.
"""
import argparse, json, pathlib, shutil, subprocess
p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('output');a=p.parse_args()
source=pathlib.Path(a.source).resolve();output=pathlib.Path(a.output).resolve()
if not source.is_file():p.error('Source video does not exist')
if output.exists() and any(output.iterdir()):p.error('Choose an empty output directory')
if not shutil.which('ffmpeg') or not shutil.which('ffprobe'):p.error('Install FFmpeg and ffprobe first')
info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(source)]));duration=float(info.get('format',{}).get('duration',0))
if not 0<duration<=1800:p.error('Use a clip between 1 and 1,800 seconds')
audio=any(s['codec_type']=='audio' for s in info['streams']);output.mkdir(parents=True,exist_ok=True)
master=['#EXTM3U','#EXT-X-VERSION:3','#EXT-X-INDEPENDENT-SEGMENTS']
for name,height,rate in [('low',240,250),('medium',480,800),('high',1080,2500)]:
 folder=output/name;folder.mkdir()
 cmd=['ffmpeg','-hide_banner','-loglevel','error','-i',str(source),'-map','0:v:0']+(['-map','0:a:0'] if audio else [])
 cmd+=['-vf',f'scale=-2:min({height}\\,ih)','-c:v','libx264','-preset','veryfast','-pix_fmt','yuv420p','-b:v',f'{rate}k','-maxrate',f'{rate}k','-bufsize',f'{rate*2}k','-force_key_frames','expr:gte(t,n_forced*6)']
 if audio:cmd+=['-c:a','aac','-b:a','48k','-ac','1']
 cmd+=['-f','hls','-hls_time','6','-hls_playlist_type','vod','-hls_flags','independent_segments','-hls_segment_filename',str(folder/'segment_%04d.ts'),str(folder/'index.m3u8')]
 subprocess.run(cmd,check=True)
 master += [f'#EXT-X-STREAM-INF:BANDWIDTH={(rate+64)*1000}',name+'/index.m3u8']
(output/'master.m3u8').write_text('\n'.join(master)+'\n')
print('Encoded HLS package:',output)
