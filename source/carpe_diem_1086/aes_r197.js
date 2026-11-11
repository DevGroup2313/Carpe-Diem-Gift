var SBOX=(function(){var s=new Uint8Array(256),p=1,q=1;function rl(x,n){return ((x<<n)|(x>>>(8-n)))&255;}
  do{p=(p^(p<<1)^((p&128)?0x1B:0))&255;q=(q^(q<<1))&255;q=(q^(q<<2))&255;q=(q^(q<<4))&255;if(q&128)q^=0x09;
    s[p]=(q^rl(q,1)^rl(q,2)^rl(q,3)^rl(q,4)^0x63)&255;}while(p!==1);s[0]=0x63;return s;})();
var TE0=new Uint32Array(256),TE1=new Uint32Array(256),TE2=new Uint32Array(256),TE3=new Uint32Array(256);
(function(){for(var i=0;i<256;i++){var s=SBOX[i],s2=((s<<1)^((s&128)?0x1B:0))&255,s3=s2^s,t=((s2<<24)|(s<<16)|(s<<8)|s3)>>>0;
  TE0[i]=t;TE1[i]=((t>>>8)|(t<<24))>>>0;TE2[i]=((t>>>16)|(t<<16))>>>0;TE3[i]=((t>>>24)|(t<<8))>>>0;}})();
function subw(t){return ((SBOX[t>>>24]<<24)|(SBOX[(t>>>16)&255]<<16)|(SBOX[(t>>>8)&255]<<8)|SBOX[t&255])>>>0;}
function expandKey(key){var w=new Uint32Array(60),i,rc=1;for(i=0;i<8;i++)w[i]=((key[4*i]<<24)|(key[4*i+1]<<16)|(key[4*i+2]<<8)|key[4*i+3])>>>0;
  for(i=8;i<60;i++){var t=w[i-1];if(i%8===0){t=subw(((t<<8)|(t>>>24))>>>0)^(rc<<24);rc=((rc<<1)^((rc&128)?0x1B:0))&255;}else if(i%8===4)t=subw(t);w[i]=(w[i-8]^t)>>>0;}return w;}
function encBlock(rk,inb,ip,out,op){
  var s0=(((inb[ip]<<24)|(inb[ip+1]<<16)|(inb[ip+2]<<8)|inb[ip+3])^rk[0])>>>0,s1=(((inb[ip+4]<<24)|(inb[ip+5]<<16)|(inb[ip+6]<<8)|inb[ip+7])^rk[1])>>>0,
      s2=(((inb[ip+8]<<24)|(inb[ip+9]<<16)|(inb[ip+10]<<8)|inb[ip+11])^rk[2])>>>0,s3=(((inb[ip+12]<<24)|(inb[ip+13]<<16)|(inb[ip+14]<<8)|inb[ip+15])^rk[3])>>>0,t0,t1,t2,t3,k=4;
  for(var r=1;r<14;r++){t0=(TE0[s0>>>24]^TE1[(s1>>>16)&255]^TE2[(s2>>>8)&255]^TE3[s3&255]^rk[k])>>>0;t1=(TE0[s1>>>24]^TE1[(s2>>>16)&255]^TE2[(s3>>>8)&255]^TE3[s0&255]^rk[k+1])>>>0;
    t2=(TE0[s2>>>24]^TE1[(s3>>>16)&255]^TE2[(s0>>>8)&255]^TE3[s1&255]^rk[k+2])>>>0;t3=(TE0[s3>>>24]^TE1[(s0>>>16)&255]^TE2[(s1>>>8)&255]^TE3[s2&255]^rk[k+3])>>>0;s0=t0;s1=t1;s2=t2;s3=t3;k+=4;}
  t0=(((SBOX[s0>>>24]<<24)|(SBOX[(s1>>>16)&255]<<16)|(SBOX[(s2>>>8)&255]<<8)|SBOX[s3&255])^rk[56])>>>0;t1=(((SBOX[s1>>>24]<<24)|(SBOX[(s2>>>16)&255]<<16)|(SBOX[(s3>>>8)&255]<<8)|SBOX[s0&255])^rk[57])>>>0;
  t2=(((SBOX[s2>>>24]<<24)|(SBOX[(s3>>>16)&255]<<16)|(SBOX[(s0>>>8)&255]<<8)|SBOX[s1&255])^rk[58])>>>0;t3=(((SBOX[s3>>>24]<<24)|(SBOX[(s0>>>16)&255]<<16)|(SBOX[(s1>>>8)&255]<<8)|SBOX[s2&255])^rk[59])>>>0;
  out[op]=t0>>>24;out[op+1]=(t0>>>16)&255;out[op+2]=(t0>>>8)&255;out[op+3]=t0&255;out[op+4]=t1>>>24;out[op+5]=(t1>>>16)&255;out[op+6]=(t1>>>8)&255;out[op+7]=t1&255;
  out[op+8]=t2>>>24;out[op+9]=(t2>>>16)&255;out[op+10]=(t2>>>8)&255;out[op+11]=t2&255;out[op+12]=t3>>>24;out[op+13]=(t3>>>16)&255;out[op+14]=(t3>>>8)&255;out[op+15]=t3&255;}
