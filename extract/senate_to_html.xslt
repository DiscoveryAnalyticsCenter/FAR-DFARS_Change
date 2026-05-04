<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    
    <xsl:output method="html" encoding="UTF-8" indent="yes" omit-xml-declaration="yes"/>
    
    <!-- Default template: copy text nodes -->
    <xsl:template match="text()">
        <xsl:value-of select="."/>
    </xsl:template>
    
    <!-- Default template: process children for unknown elements -->
    <xsl:template match="*">
        <xsl:apply-templates/>
    </xsl:template>
    
    <!-- Section element (Senate format: enum + header + text/subsections) -->
    <xsl:template match="section">
        <div class="section">
            <xsl:variable name="enum" select="enum"/>
            <xsl:variable name="header" select="header"/>
            <xsl:if test="$enum and $header">
                <h2>
                    <xsl:text>Section </xsl:text>
                    <xsl:value-of select="normalize-space($enum)"/>
                    <xsl:text>: </xsl:text>
                    <xsl:apply-templates select="$header"/>
                </h2>
            </xsl:if>
            <xsl:apply-templates select="*[not(self::enum) and not(self::header)]"/>
        </div>
    </xsl:template>
    
    <!-- Subsection element -->
    <xsl:template match="subsection">
        <div class="subsection">
            <xsl:variable name="enum" select="enum"/>
            <xsl:variable name="header" select="header"/>
            <xsl:if test="$enum and $header">
                <h3>
                    <xsl:value-of select="normalize-space($enum)"/>
                    <xsl:text> </xsl:text>
                    <xsl:apply-templates select="$header"/>
                </h3>
            </xsl:if>
            <xsl:apply-templates select="*[not(self::enum) and not(self::header)]"/>
        </div>
    </xsl:template>
    
    <!-- Paragraph element -->
    <xsl:template match="paragraph">
        <div class="paragraph">
            <xsl:variable name="enum" select="enum"/>
            <xsl:if test="$enum">
                <span class="paragraph-num">
                    <xsl:value-of select="normalize-space($enum)"/>
                    <xsl:text> </xsl:text>
                </span>
            </xsl:if>
            <xsl:apply-templates select="*[not(self::enum)]"/>
        </div>
    </xsl:template>
    
    <!-- Text element (Senate equivalent of content) -->
    <xsl:template match="text">
        <span class="content">
            <xsl:apply-templates/>
        </span>
    </xsl:template>
    
    <!-- Enum element (Senate equivalent of num) -->
    <xsl:template match="enum">
        <span class="num">
            <xsl:value-of select="normalize-space(.)"/>
        </span>
    </xsl:template>
    
    <!-- Header element (Senate equivalent of heading) -->
    <xsl:template match="header">
        <span class="heading">
            <xsl:apply-templates/>
        </span>
    </xsl:template>
    
    <!-- Quote element -->
    <xsl:template match="quote">
        <span class="quoted-content">
            <xsl:text>"</xsl:text>
            <xsl:apply-templates/>
            <xsl:text>"</xsl:text>
        </span>
    </xsl:template>
    
    <!-- Short title element -->
    <xsl:template match="short-title">
        <cite>
            <xsl:apply-templates/>
        </cite>
    </xsl:template>
    
    <!-- External cross-reference -->
    <xsl:template match="external-xref">
        <xsl:apply-templates/>
    </xsl:template>
    
    <!-- Quoted block (amendment content) -->
    <xsl:template match="quoted-block">
        <blockquote class="quoted-block">
            <xsl:apply-templates/>
        </blockquote>
    </xsl:template>
    
    <!-- Header-in-text (inline header reference) -->
    <xsl:template match="header-in-text">
        <span class="header-in-text">
            <xsl:apply-templates/>
        </span>
    </xsl:template>
    
    <!-- Pagebreak (skip in HTML) -->
    <xsl:template match="pagebreak">
        <!-- Skip -->
    </xsl:template>
    
    <!-- TOC and related structural elements - skip for section extraction -->
    <xsl:template match="toc | toc-entry">
        <!-- Skip when processing section content -->
    </xsl:template>
    
    <!-- Division, title, subtitle - pass through children -->
    <xsl:template match="division | title | subtitle">
        <xsl:apply-templates/>
    </xsl:template>
    
</xsl:stylesheet>
