<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:uslm="http://schemas.gpo.gov/xml/uslm"
    exclude-result-prefixes="uslm">
    
    <xsl:output method="html" encoding="UTF-8" indent="yes" omit-xml-declaration="yes"/>
    
    <!-- Default template: copy text nodes -->
    <xsl:template match="text()">
        <xsl:value-of select="."/>
    </xsl:template>
    
    <!-- Default template: process children for unknown elements -->
    <xsl:template match="*">
        <xsl:apply-templates/>
    </xsl:template>
    
    <!-- Section element (handles both namespaced and non-namespaced) -->
    <xsl:template match="uslm:section | section">
        <div class="section">
            <xsl:variable name="num" select="(uslm:num | num)"/>
            <xsl:variable name="heading" select="(uslm:heading | heading)"/>
            <xsl:if test="$num and $heading">
                <h2>
                    <xsl:text>Section </xsl:text>
                    <xsl:value-of select="normalize-space($num)"/>
                    <xsl:text>: </xsl:text>
                    <xsl:apply-templates select="$heading"/>
                </h2>
            </xsl:if>
            <xsl:apply-templates select="*[not(self::uslm:num) and not(self::num) and not(self::uslm:heading) and not(self::heading)]"/>
        </div>
    </xsl:template>
    
    <!-- Subsection element -->
    <xsl:template match="uslm:subsection | subsection">
        <div class="subsection">
            <xsl:variable name="num" select="(uslm:num | num)"/>
            <xsl:variable name="heading" select="(uslm:heading | heading)"/>
            <xsl:if test="$num and $heading">
                <h3>
                    <xsl:value-of select="normalize-space($num)"/>
                    <xsl:text> </xsl:text>
                    <xsl:apply-templates select="$heading"/>
                </h3>
            </xsl:if>
            <xsl:apply-templates select="*[not(self::uslm:num) and not(self::num) and not(self::uslm:heading) and not(self::heading)]"/>
        </div>
    </xsl:template>
    
    <!-- Paragraph element -->
    <xsl:template match="uslm:paragraph | paragraph">
        <div class="paragraph">
            <xsl:variable name="num" select="(uslm:num | num)"/>
            <xsl:if test="$num">
                <span class="paragraph-num">
                    <xsl:value-of select="normalize-space($num)"/>
                    <xsl:text> </xsl:text>
                </span>
            </xsl:if>
            <xsl:apply-templates select="*[not(self::uslm:num) and not(self::num)]"/>
        </div>
    </xsl:template>
    
    <!-- Subparagraph element -->
    <xsl:template match="uslm:subparagraph | subparagraph">
        <div class="subparagraph">
            <xsl:variable name="num" select="(uslm:num | num)"/>
            <xsl:if test="$num">
                <span class="subparagraph-num">
                    <xsl:value-of select="normalize-space($num)"/>
                    <xsl:text> </xsl:text>
                </span>
            </xsl:if>
            <xsl:apply-templates select="*[not(self::uslm:num) and not(self::num)]"/>
        </div>
    </xsl:template>
    
    <!-- Paragraph (p) element -->
    <xsl:template match="uslm:p | p">
        <p>
            <xsl:apply-templates/>
        </p>
    </xsl:template>
    
    <!-- Content element -->
    <xsl:template match="uslm:content | content">
        <span class="content">
            <xsl:apply-templates/>
        </span>
    </xsl:template>
    
    <!-- Quoted content element -->
    <xsl:template match="uslm:quotedcontent | quotedcontent">
        <blockquote class="quoted-content">
            <xsl:apply-templates/>
        </blockquote>
    </xsl:template>
    
    <!-- Heading element -->
    <xsl:template match="uslm:heading | heading">
        <span class="heading">
            <xsl:apply-templates/>
        </span>
    </xsl:template>
    
    <!-- Num element -->
    <xsl:template match="uslm:num | num">
        <span class="num">
            <xsl:value-of select="normalize-space(.)"/>
        </span>
    </xsl:template>
    
    <!-- Inline element -->
    <xsl:template match="uslm:inline | inline">
        <span>
            <xsl:if test="@class">
                <xsl:attribute name="class">
                    <xsl:value-of select="@class"/>
                </xsl:attribute>
            </xsl:if>
            <xsl:choose>
                <xsl:when test="contains(@class, 'smallCaps') or contains(@class, 'smallcaps')">
                    <strong>
                        <xsl:value-of select="translate(., 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')"/>
                    </strong>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:apply-templates/>
                </xsl:otherwise>
            </xsl:choose>
        </span>
    </xsl:template>
    
    <!-- Reference element -->
    <xsl:template match="uslm:ref | ref">
        <a>
            <xsl:if test="@href">
                <xsl:attribute name="href">
                    <xsl:value-of select="@href"/>
                </xsl:attribute>
            </xsl:if>
            <xsl:apply-templates/>
        </a>
    </xsl:template>
    
    <!-- Amending action element -->
    <xsl:template match="uslm:amendingaction | amendingaction">
        <span class="amending-action">
            <xsl:choose>
                <xsl:when test="@type = 'amend'">
                    <em>
                        <xsl:apply-templates/>
                    </em>
                </xsl:when>
                <xsl:when test="@type = 'add'">
                    <strong>
                        <xsl:apply-templates/>
                    </strong>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:apply-templates/>
                </xsl:otherwise>
            </xsl:choose>
        </span>
    </xsl:template>
    
    <!-- Sidenote element -->
    <xsl:template match="uslm:sidenote | sidenote">
        <div class="sidenote">
            <strong>Note:</strong>
            <xsl:text> </xsl:text>
            <xsl:apply-templates/>
        </div>
    </xsl:template>
    
    <!-- List item element -->
    <xsl:template match="uslm:listitem | listitem | uslm:li | li">
        <li>
            <xsl:apply-templates/>
        </li>
    </xsl:template>
    
    <!-- List element -->
    <xsl:template match="uslm:list | list | uslm:ul | ul | uslm:ol | ol">
        <ul>
            <xsl:apply-templates/>
        </ul>
    </xsl:template>
    
    <!-- Chapeau element -->
    <xsl:template match="uslm:chapeau | chapeau">
        <div class="chapeau">
            <xsl:apply-templates/>
        </div>
    </xsl:template>
    
    <!-- Short title element -->
    <xsl:template match="uslm:shortTitle | shortTitle">
        <cite>
            <xsl:apply-templates/>
        </cite>
    </xsl:template>
    
    <!-- Page element (usually hidden in HTML) -->
    <xsl:template match="uslm:page | page">
        <!-- Skip page elements in HTML output -->
    </xsl:template>
    
</xsl:stylesheet>

