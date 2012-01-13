package org.apache.hadoop.mapred;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;

import org.apache.commons.io.IOUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

class AuditServerHttpClient {
	private static final Log log = LogFactory.getLog(AuditServerHttpClient.class);
	
	private final String baseUrl;

	enum AuditServerResponse {OK, NOK};
	
	public AuditServerHttpClient(String baseUrl) {
		this.baseUrl = baseUrl;
	}
	
	AuditServerResponse challengeServer(String user, String token, String jarName, String jarSha1Hex) {
		URL url;
		HttpURLConnection connection = null;
		String urlString = baseUrl + "/" + user + "/" + token + "/" + jarName + "/" + jarSha1Hex;
		try {
			url = new URL(urlString);
			connection = (HttpURLConnection) url.openConnection();
			connection.connect();
			
			if (connection.getResponseCode() == 200) {
				return AuditServerResponse.OK;
			} else {
				String response = IOUtils.toString(connection.getInputStream(), "UTF-8");
				log.warn("Got response != 200 form audit server after challenge.\nResponse = " + response);
				
				return AuditServerResponse.NOK;
			}
		} catch (MalformedURLException mue) {
			log.error("Malformed URL caught before contacting audit server! URL = " + urlString, mue);
			return AuditServerResponse.NOK;
		} catch (IOException ioe) {
			log.error("IO Exception while contacting audit server.", ioe);
			return AuditServerResponse.NOK;
		} finally {
			if (connection != null) {
				connection.disconnect();
			}
		}
	}
}
