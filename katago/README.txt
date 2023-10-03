KataGo v1.13.0
https://github.com/lightvector/KataGo

For neural nets from the latest run, download from here: 
https://katagotraining.org/
For nets from earlier runs, see:
https://katagoarchive.org/

For differences between this version and older versions, see releases page at 
https://github.com/lightvector/KataGo/releases/

-----------------------------------------------------
USAGE:
-----------------------------------------------------
KataGo is just an engine and does not have its own graphical interface. So generally you will want to use KataGo along with a GUI or analysis program.
(https://github.com/lightvector/KataGo#guis)

FIRST: Run a command like this to make sure KataGo is working, with the neural net file you downloaded. On OpenCL, it will also tune for your GPU.

./katago.exe benchmark                                                   # if you have default_gtp.cfg and default_model.bin.gz
./katago.exe benchmark -model <NEURALNET>.bin.gz                         # if you have default_gtp.cfg
./katago.exe benchmark -model <NEURALNET>.bin.gz -config gtp_custom.cfg  # use this .bin.gz neural net and this .cfg file

It will tell you a good number of threads. Edit your .cfg file and set "numSearchThreads" to that many to get best performance.

OR: Run this command to have KataGo generate a custom gtp config for you based on answering some questions:

./katago.exe genconfig -model <NEURALNET>.bin.gz -output gtp_custom.cfg

NEXT: A command like this will run KataGo's engine. This is the command to give to your [GUI or analysis program](#guis) so that it can run KataGo.

./katago.exe gtp                                                   # if you have default_gtp.cfg and default_model.bin.gz
./katago.exe gtp -model <NEURALNET>.bin.gz                         # if you have default_gtp.cfg
./katago.exe gtp -model <NEURALNET>.bin.gz -config gtp_custom.cfg  # use this .bin.gz neural net and this .cfg file

You may need to specify different paths when entering KataGo's command for a GUI program, e.g.:

path/to/katago.exe gtp -model path/to/<NEURALNET>.bin.gz
path/to/katago.exe gtp -model path/to/<NEURALNET>.bin.gz -config path/to/gtp_custom.cfg

KataGo should be able to work with any GUI program that supports GTP, as well as any analysis program that supports Leela Zero's `lz-analyze` command, such as Lizzie (https://github.com/featurecat/lizzie) or Sabaki (https://sabaki.yichuanshen.de/).

NOTE:
If you encounter errors due to a missing "msvcp140.dll" or "msvcp140_1.dll" or "msvcp140_2.dll" or "vcruntime140.dll" or similar, you need to download and install the Microsoft Visual C++ Redistributable, here:
https://www.microsoft.com/en-us/download/details.aspx?id=48145
If this is for a 64-bit Windows version of KataGo, these dll files have already been included for you, otherwise you will need to install them yourself. On a 64-bit Windows version, there is a rare chance that you may need to delete them if you already have it installed yourself separately and the pre-included files are actually causing problems running KataGo.


Other things you can do:

Run a JSON-based analysis engine (https://github.com/lightvector/KataGo/blob/master/docs/Analysis_Engine.md) that can do efficient batched evaluations for a backend Go service:

./katago analysis -model <NEURALNET>.gz -config <ANALYSIS_CONFIG>.cfg

Run a high-performance match engine that will play a pool of bots against each other sharing the same GPU batches and CPUs with each other:

./katago match -config <MATCH_CONFIG>.cfg -log-file match.log -sgf-output-dir <DIR TO WRITE THE SGFS>

Force OpenCL tuner to re-tune:

./katago tuner -config <GTP_CONFIG>.cfg

Print version:

./katago version


-----------------------------------------------------
OPENCL VS CUDA VS EIGEN:
-----------------------------------------------------
Explanation of the various versions available at https://github.com/lightvector/KataGo/releases

OpenCL - Use this if you have a modern GPU and want the easiest setup.

TensorRT, CUDA11 - Try one of these if you have a top-end NVIDIA GPU, are willing to do some more technical setup work, and care about getting every bit of performance. It MIGHT OR MIGHT NOT be faster than OpenCL! You have to test it on your specific GPU. TensorRT requires CUDA11 as well, and is likely to be the fastest.

Eigen AVX2 - Use this if you have no good GPU, but you have an Intel or AMD CPU from the last several years. This is a pure CPU version of KataGo.

Eigen - Use this if you don't have a GPU or your GPU is too old to work, and your CPU turns out not to support AVX2 or FMA. This is a pure CPU version for KataGo for 
This is the pure CPU version of KataGo, with no special instructions, which should hopefully run just about anywhere.


-----------------------------------------------------
TUNING FOR PERFORMANCE:
-----------------------------------------------------
You will very likely want to tune some of the parameters in `default_gtp.cfg` for your system for good performance, including the number of threads, fp16 usage, NN cache size, pondering settings, and so on. You can also adjust things like KataGo's resign threshold or utility function. Most of the relevant parameters should be be reasonably well documented directly inline in that config.

There are other a few notes about usage and performance at : https://github.com/lightvector/KataGo

-----------------------------------------------------
TROUBLESHOOTING:
-----------------------------------------------------
Some common issues are described here:
https://github.com/lightvector/KataGo#common-causes-of-errors

Or, feel free to hop into the Leela Zero discord chat, which has become a general chatroom for a variety of computer Go hobbyists and users, and which you can often find people willing to help.
https://discord.gg/fhDHgfk




