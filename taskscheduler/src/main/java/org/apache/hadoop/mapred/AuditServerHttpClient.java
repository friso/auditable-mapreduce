package org.apache.hadoop.mapred;

class AuditServerHttpClient {
	enum AuditServerResponse {OK, NOK};
	
	AuditServerResponse challengeServer(String token, String jarName, String jarSha1Hex) {
		return AuditServerResponse.NOK;
	}
}
