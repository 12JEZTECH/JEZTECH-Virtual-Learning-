"""Render original AI-assisted, captioned teaching-model clips. No third-party footage.
Requires Pillow and ffmpeg. Output server-only TypeScript payloads; never public assets.
"""
from PIL import Image,ImageDraw,ImageFont
import subprocess,math,base64,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=Path('/tmp/jeztech-generated-practicals');OUT.mkdir(exist_ok=True)
F='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def font(n,b=False):return ImageFont.truetype(B if b else F,n)
W,H=960,540;FPS=15;DURATION=32
clips=[
 dict(id='ai-circuit',title='AI-assisted model: open and closed circuits',experiment='circuit',explanation='Original AI-assisted animation with on-screen captions. A complete conducting path allows current in this simplified low-voltage model. With 6 V across 100 ohms, I = V/R = 0.06 A (60 mA). Observe the switch, then compare voltage and resistance in the virtual workbench. Teacher review required; this is not recorded laboratory footage. No mains electricity.'),
 dict(id='ai-magnification',title='AI-assisted model: microscope magnification',experiment='microscope',explanation='Original AI-assisted diagram animation with on-screen captions. Total magnification equals eyepiece magnification multiplied by objective magnification. A 10x eyepiece and 4x objective give 40x; a 10x objective gives 100x. Increasing magnification shows a smaller field of view in this schematic. The cell drawings are illustrative, not calibrated microscopy images. Teacher review required.'),
 dict(id='ai-speed',title='AI-assisted model: measuring average speed',experiment='general',explanation='Original AI-assisted measurement animation with on-screen captions. A model object covers 20 m in 5 s, so average speed is total distance divided by total time: 4 m/s. Average speed does not describe every instant of a journey. Record units and discuss timing uncertainty in real measurements. Teacher review required; the animation is a model rather than experimental evidence.')]
def wrapped(d,text,x,y,width,size=25,color='#e5eee8'):
 words=text.split();line=''
 for word in words:
  test=(line+' '+word).strip()
  if d.textlength(test,font=font(size))>width and line:d.text((x,y),line,font=font(size),fill=color);y+=size+9;line=word
  else:line=test
 if line:d.text((x,y),line,font=font(size),fill=color)
def frame(c,t):
 im=Image.new('RGB',(W,H),'#102c29');d=ImageDraw.Draw(im)
 d.text((36,20),'JEZTECH / PRACTICAL LEARNING',font=font(17,True),fill='#e2ca91')
 d.text((36,53),c['title'].replace('AI-assisted model: ','').capitalize(),font=font(30,True),fill='white')
 d.rounded_rectangle((34,105,926,390),18,fill='#e8efe3')
 if c['id']=='ai-circuit':
  closed=8<=t<25;col='#bd8b30' if closed else '#7a8f83'
  d.line([(180,317),(180,180),(700,180),(700,317),(180,317)],fill=col,width=8)
  d.rectangle((138,226,220,295),fill='#315e4c');d.text((153,244),'6 V',font=font(24,True),fill='white')
  d.rounded_rectangle((394,156,506,204),8,fill='#b99d62');d.text((404,211),'100 ohms',font=font(17),fill='#244936')
  d.rectangle((560,295,646,337),fill='#e8efe3');d.ellipse((556,310,570,324),fill=col);d.ellipse((636,310,650,324),fill=col)
  d.line((563,317,643,317) if closed else (563,317,635,275),fill='#315e4c',width=7)
  d.text((560,349),'CLOSED' if closed else 'OPEN',font=font(18,True),fill='#315e4c')
  d.ellipse((660,206,744,290),fill='white',outline='#315e4c',width=4);d.text((674,234),'60 mA' if closed else '0 mA',font=font(17,True),fill='#315e4c')
  if closed:
   path=[(180,180),(700,180),(700,317),(180,317),(180,180)];pos=((t-8)*180)%1314
   for a,b in zip(path,path[1:]):
    length=abs(a[0]-b[0])+abs(a[1]-b[1])
    if pos<=length:
     x=a[0]+(b[0]-a[0])*pos/length;y=a[1]+(b[1]-a[1])*pos/length;d.ellipse((x-7,y-7,x+7,y+7),fill='#e8bd4b');break
    pos-=length
  caption='1. An open switch breaks the conducting path.' if t<8 else '2. Close the switch: the model shows current in a complete path.' if t<17 else '3. I = V / R = 6 / 100 = 0.06 A = 60 mA.' if t<25 else 'Check: what happens to current when the switch opens?'
 elif c['id']=='ai-magnification':
  high=t>=14;mag=100 if high else 40
  d.ellipse((325,121,594,382),fill='#d7e4d0',outline='#527a5c',width=5)
  # illustrative cells; clipped positions remain inside the field circle
  size=76 if high else 42
  for x,y in ([(410,195),(505,252),(410,312)] if high else [(390,180),(445,180),(500,180),(390,235),(445,235),(500,235),(390,290),(445,290),(500,290),(445,345)]):
   d.rounded_rectangle((x-size/2,y-size/2,x+size/2,y+size/2),9,fill='#b4d197',outline='#527a5c',width=2);d.ellipse((x-7,y-7,x+7,y+7),fill='#6b8360')
  d.text((75,162),'Eyepiece: 10x',font=font(22,True),fill='#315e4c');d.text((75,204),'Objective: '+('10x' if high else '4x'),font=font(22),fill='#315e4c')
  d.text((638,206),str(mag)+'x total',font=font(25,True),fill='#315e4c');d.text((638,246),'Schematic only',font=font(17),fill='#315e4c')
  caption='1. Total magnification = eyepiece x objective.' if t<7 else '2. With a 10x eyepiece and 4x objective: 10 x 4 = 40x.' if t<14 else '3. Change to a 10x objective: 10 x 10 = 100x.' if t<24 else 'Check: which view shows a smaller area of the specimen?'
 else:
  progress=max(0,min(1,(t-5)/10));x=145+progress*650
  d.line((145,300,795,300),fill='#537663',width=4)
  for i in range(5):
   a=145+i*162.5;d.line((a,290,a,315),fill='#537663',width=3);d.text((a-13,325),str(i*5)+' m',font=font(20),fill='#315e4c')
  d.rounded_rectangle((x-22,240,x+22,274),7,fill='#b58f48');d.ellipse((x-17,269,x-5,281),fill='#315e4c');d.ellipse((x+5,269,x+17,281),fill='#315e4c')
  d.text((75,137),'Distance = 20 m',font=font(24,True),fill='#315e4c');d.text((75,179),'Time = '+str(round(progress*5,1))+' s',font=font(24),fill='#315e4c')
  if t>=16:d.text((485,156),'20 m / 5 s = 4 m/s',font=font(28,True),fill='#315e4c')
  caption='1. Agree on a measured distance and record the units.' if t<5 else '2. The model covers 20 metres in 5 seconds.' if t<16 else '3. Average speed = total distance / total time = 4 m/s.' if t<25 else 'Check: why can repeated timing improve a measurement?'
 wrapped(d,caption,38,412,884,24)
 d.text((38,503),'AI-assisted animation | Captioned, no narration | Teacher review required',font=font(16),fill='#bfd0c3')
 d.rectangle((0,535,int(W*t/DURATION),539),fill='#d5b970')
 return im
for c in clips:
 target=OUT/(c['id']+'.mp4');p=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','29','-pix_fmt','yuv420p','-movflags','+faststart',str(target)],stdin=subprocess.PIPE)
 for i in range(FPS*DURATION):p.stdin.write(frame(c,i/FPS).tobytes())
 p.stdin.close();assert p.wait()==0
 # Payload is imported only by the authenticated server video route.
 payload=base64.b64encode(target.read_bytes()).decode()
 (ROOT/'app/virtual-lab/generated'/(c['id']+'.ts')).write_text('export default '+json.dumps(payload)+';\n')
 frame(c,18).save(OUT/(c['id']+'-review.png'))
 c['duration']=DURATION;c['generated']=True;c['teacher_id']='system';c['teacher_name']='JEZTECH · AI-assisted teaching model';c['created_at']=1792339200000
 print(c['id'],target.stat().st_size,flush=True)
(ROOT/'app/virtual-lab/generated/catalog.json').write_text(json.dumps(clips,ensure_ascii=False,indent=2))
