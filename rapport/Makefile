TEX      = pdflatex
BIB      = bibtex
MAIN     = main
BUILDDIR = build

.PHONY: all clean view

all:
	$(TEX) $(MAIN).tex
	$(BIB) $(MAIN) || true
	$(TEX) $(MAIN).tex
	$(TEX) $(MAIN).tex

once:
	$(TEX) $(MAIN).tex

clean:
	rm -f $(MAIN).{aux,bbl,blg,log,lof,lot,out,toc,pdf,synctex.gz}
	rm -f chapters/*.aux

view: all
	@echo "Open $(MAIN).pdf with your PDF viewer."
