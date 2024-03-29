<?php

/**
 * @group MobileFrontend
 */
 class MF_DeviceDetectionTest extends MediaWikiTestCase {

	/**
	 * @dataProvider provideTestFormatName
	 */
 	public function testFormatName( $format, $userAgent ) {
		$detector = new DeviceDetection();
		$this->assertEquals( $format, $detector->detectFormatName( $userAgent ) );
	}

	public function provideTestFormatName() {
		return array(
			// Firefox OS (bug 40919)
			array( 'capable', 'Mozilla/5.0 (Mobile; rv:14.0) Gecko/14.0 Firefox/14.0' ),
			// Fennec
			array( 'capable', 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.7; en-US; rv:1.9.2.1pre) Gecko/20100126 Namoroka/3.6.1pre Fennec/1.0pre' ),
			// Blackberry 10 (bug 40513)
			array( 'webkit', 'Mozilla/5.0 (BB10; Touch) AppleWebKit/537.3+ (KHTML, like Gecko) Version/10.0.9.386 Mobile Safari/537.3+' ),
			// Windows Phone 8 / IE 10 (bug 41517)
			array( 'ie', 'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; ARM; Touch; IEMobile/10.0; <Manufacturer>; <Device> [;<Operator>])' ),
			// Others
			array( 'android',   'Mozilla/5.0 (Linux; U; Android 2.1; en-us; Nexus One Build/ERD62) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17' ),
			array( 'iphone2',   'Mozilla/5.0 (ipod: U;CPU iPhone OS 2_2 like Mac OS X: es_es) AppleWebKit/525.18.1 (KHTML, like Gecko) Version/3.0 Mobile/3B48b Safari/419.3' ),
			array( 'iphone',    'Mozilla/5.0 (iPhone; U; CPU like Mac OS X; en) AppleWebKit/420.1 (KHTML, like Gecko) Version/3.0 Mobile/3B48b Safari/419.3' ),
			array( 'nokia',     'Mozilla/5.0 (SymbianOS/9.1; U; [en]; SymbianOS/91 Series60/3.0) AppleWebKit/413 (KHTML, like Gecko) Safari/413' ),
			array( 'palm_pre',  'Mozilla/5.0 (webOS/1.0; U; en-US) AppleWebKit/525.27.1 (KHTML, like Gecko) Version/1.0 Safari/525.27.1 Pre/1.0' ),
			array( 'wii',       'Opera/9.00 (Nintendo Wii; U; ; 1309-9; en)' ),
			array( 'operamini', 'Opera/9.50 (J2ME/MIDP; Opera Mini/4.0.10031/298; U; en)' ),
			array( 'operamobile',    'Opera/9.51 Beta (Microsoft Windows; PPC; Opera Mobi/1718; U; en)' ),
			array( 'kindle',    'Mozilla/4.0 (compatible; Linux 2.6.10) NetFront/3.3 Kindle/1.0 (screen 600x800)' ),
			array( 'kindle2',   'Mozilla/4.0 (compatible; Linux 2.6.22) NetFront/3.4 Kindle/2.0 (screen 824x1200; rotate)' ),
			array( 'capable',   'Mozilla/5.0 (X11; Linux i686; rv:2.0.1) Gecko/20100101 Firefox/4.0.1' ),
			array( 'netfront',  'Mozilla/4.08 (Windows; Mobile Content Viewer/1.0) NetFront/3.2' ),
			array( 'wap2',      'SonyEricssonK608i/R2L/SN356841000828910 Browser/SEMC-Browser/4.2 Profile/MIDP-2.0 Configuration/CLDC-1.1' ),
			array( 'wap2',      'NokiaN73-2/3.0-630.0.2 Series60/3.0 Profile/MIDP-2.0 Configuration/CLDC-1.1' ),
			array( 'psp',       'Mozilla/4.0 (PSP (PlayStation Portable); 2.00)' ),
			array( 'ps3',       'Mozilla/5.0 (PLAYSTATION 3; 1.00)' ),
			array( 'ie', 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)' ),
			array( 'ie', 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0)' ),
			array( 'blackberry', 'BlackBerry9300/5.0.0.716 Profile/MIDP-2.1 Configuration/CLDC-1.1 VendorID/133' ),
			array( 'blackberry-lt5', 'BlackBerry7250/4.0.0 Profile/MIDP-2.0 Configuration/CLDC-1.1' ),
			array( 'capable', 'Mozilla/5.0 (X11; U; Linux armv7l; en-US; rv:1.9.2b6pre) Gecko/20100318 Firefox/3.5 Maemo Browser 1.7.4.8 RX-51 N900' )
		);
	}

	/**
	 * @dataProvider provideTestDeviceCapabilities
	 */
	public function testDeviceCapabilities( $format, $js, $jquery ) {
		$detector = new DeviceDetection();
		$device = $detector->getDevice( $format );
		$this->assertEquals( $device['supports_javascript'], $js );
		$this->assertEquals( $device['supports_jquery'], $jquery );
	}

	public function provideTestDeviceCapabilities() {
		return array(
			array( 'webkit', true, true ),
			array( 'capable', true, true ),
			array( 'ie', true, true ),
			array( 'nokia', true, false ),
			array( 'blackberry', true, false ),
			array( 'blackberry-lt5', false, false ),
			array( 'html', false, false ),
		);
	}
}
